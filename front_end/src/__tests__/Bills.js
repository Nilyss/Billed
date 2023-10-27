/**
 * @jest-environment jsdom
 */

import 'whatwg-fetch' // https://www.npmjs.com/package/whatwg-fetch 'cause node-fetch isn't working
import {screen, waitFor} from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import {bills} from "../fixtures/bills.js";
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from '../__mocks__/store.js'
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import userEvent from '@testing-library/user-event'


jest.mock('../app/Store.js', () => mockStore)

describe("Given I am connected as an employee", () => {
    describe("When I am on Bills Page", () => {
        test("Then bill icon in vertical layout should be highlighted", async () => {
            Object.defineProperty(window, "localStorage", {
                value: localStorageMock,
            });
            window.localStorage.setItem("user", JSON.stringify({
                type: "Employee",
            }));
            const root = document.createElement("div");
            root.setAttribute("id", "root");
            document.body.append(root);
            router();
            window.onNavigate(ROUTES_PATH.Bills);
            await waitFor(() => screen.getByTestId("icon-window"));
            const windowIcon = screen.getByTestId("icon-window");
            expect(windowIcon.classList.contains('active-icon')).toBe(true)
        });
        test("Then bills should be ordered from earliest to latest", () => {
            document.body.innerHTML = BillsUI({data: bills});
            const dates = screen
                .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
                .map((a) => a.innerHTML);
            const antiChrono = (a, b) => (a < b ? 1 : -1);
            const datesSorted = dates.sort(antiChrono);
            expect(dates).toEqual(datesSorted);
        });
    });
});

// test integration Get bills
describe(`Given i'm a user connected as an employee`, () => {
    describe(`When i navigate to Bills page`, () => {
        test(`fetches bills from mock API GET`, async () => {
            Object.defineProperty(window, 'localStorage', {value: localStorageMock})
            localStorage.setItem('user', JSON.stringify({type: 'Employee', email: 'a@a'}));
            const root = document.createElement('div')
            root.setAttribute('id', 'root')
            document.body.append(root)
            router()
            window.onNavigate(ROUTES_PATH.Bills)
            await waitFor(() => expect(screen.getByText('Mes notes de frais')).toBeTruthy())
        })
        describe('When an error occurs on API', () => {
            beforeEach(() => {
                jest.spyOn(mockStore, 'bills')
                Object.defineProperty(
                    window,
                    'localStorage',
                    {value: localStorageMock}
                )
                window.localStorage.setItem('user', JSON.stringify({
                    type: 'Employee',
                    email: 'a@a'
                }))
                const root = document.createElement('div')
                root.setAttribute('id', 'root')
                document.body.appendChild(root)
                router()
            })
            test('fetches bills from an API and fails with 404 message error', async () => {
                mockStore.bills.mockImplementationOnce(() => {
                    return {
                        list: () => {
                            return Promise.reject(new Error('Erreur 404'))
                        }
                    }
                })
                window.onNavigate(ROUTES_PATH.Bills)
                await new Promise(process.nextTick)
                await expect(screen.getByText(/Erreur 404/)).toBeTruthy()
            })
            test('Fetches messages from an API and fails with 500 message error', async () => {
                mockStore.bills.mockImplementationOnce(() => {
                    return {
                        list: () => {
                            return Promise.reject(new Error('Erreur 500'))
                        }
                    }
                })

                window.onNavigate(ROUTES_PATH.Bills)
                await new Promise(process.nextTick)
                expect(await screen.getByText(/Erreur 500/)).toBeTruthy()
            })
        })
    })
})

// testing toggle modal
describe(`When I am on Bills page, I click on the eye icon of a bill`, () => {
    test(`Then the modal should appear, and the picture should be displayed`, () => {
        Object.defineProperty(window, 'localStorage', {value: localStorageMock})
        localStorage.setItem('user', JSON.stringify({type: 'Employee', email: 'a@a'}));
        document.body.innerHTML = BillsUI({data: bills.sort((a, b) => new Date(b.date) - new Date(a.date))})
        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname })
        }

        const createBills = new Bills({
            document,
            onNavigate,
            store: mockStore,
            localStorage: window.localStorage,
        })

        $.fn.modal = jest.fn()
        const onClickIconEye = jest.fn((e) => createBills.handleClickIconEye(e.target))

        const icnEye = screen.getAllByTestId('icon-eye')[0]
        icnEye.addEventListener('click', onClickIconEye)
        userEvent.click(icnEye)

        expect($.fn.modal).toHaveBeenCalled()
        expect(screen.getByText('Justificatif')).toBeTruthy()
        expect(screen.getByAltText('Bill')).toBeTruthy()
    });
});

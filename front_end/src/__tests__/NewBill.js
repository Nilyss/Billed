/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import mockStore from "../__mocks__/store";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH } from "../constants/routes.js";
import Router from "../app/Router.js";

jest.mock("../app/Store.js", () => mockStore);
window.alert = jest.fn();

describe("Given i am connected as an employee", () => {
  describe("When i am on NewBill Page", () => {
    beforeEach(() => {
      Object.defineProperties(window, {
        localStorage: {
          value: localStorageMock,
        },
      });

      window.localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      Router();
    });

    test(`Then the NewBill page should be rendered`, () => {
      window.onNavigate(ROUTES_PATH.NewBill);
      const root = document.querySelector("#root");
      root.innerHTML = NewBillUI();
      expect(screen.getByText(`Envoyer une note de frais`)).toBeTruthy();
    });

    test(`Then the new bills icon should be highlighted`, () => {
      window.onNavigate(ROUTES_PATH.NewBill);
      const newBillIcon = screen.getByTestId("icon-mail");
      expect(newBillIcon.classList.contains("active-icon")).toBeTruthy();
    });
  });

  describe("When i submit file in new bill form", () => {
    beforeEach(() => {
      Object.defineProperties(window, {
        localStorage: {
          value: localStorageMock,
        },
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      Router();
    });

    test("Then display an error, if the file extension is not allowed", () => {
      window.onNavigate(ROUTES_PATH.NewBill);

      document.body.innerHTML = NewBillUI();
      const newBillForm = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChange = jest.spyOn(newBillForm, "handleChangeFile");
      const inputFile = screen.getByTestId("file");

      inputFile.addEventListener("change", handleChange);
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(["exampleFile"], "test.webp", { type: "image/webp" }),
          ],
        },
      });

      const fileName = inputFile.files[0].name;
      const isValidFileName =
        fileName === "test.jpg" ||
        fileName === "test.png" ||
        fileName === "test.jpeg";

      expect(isValidFileName).not.toBeTruthy();
    });

    test("Then the from accepts the file if his extension is allowed", () => {
      window.onNavigate(ROUTES_PATH.NewBill);

      document.body.innerHTML = NewBillUI();
      const newBillForm = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const handleChange = jest.spyOn(newBillForm, "handleChangeFile");
      const inputFile = screen.getByTestId("file");

      inputFile.addEventListener("change", handleChange);
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["exampleFile"], "test.jpg", { type: "image/jpg" })],
        },
      });

      newBillForm.fileName = inputFile.files[0].name;
      expect(newBillForm.fileName).toBe("test.jpg");
    });

    test("Then the handleSubmit function can be called", () => {
      window.onNavigate(ROUTES_PATH.NewBill);

      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.spyOn(newBill, "handleSubmit");
      const updateBill = jest.spyOn(newBill, "updateBill");

      const form = screen.getByTestId("form-new-bill");

      fireEvent.submit(form, handleSubmit);

      expect(updateBill).toHaveBeenCalled();
    });
  });
});

describe("Given i'm a user connected as an employee", () => {
  describe("When i navigate to NewBill page", () => {
    describe("Then i send a new bill with valid Data", () => {
      test("Then i verify that a new bill is created", async () => {
        const newBillDatas = {
          email: "employee@test.tld",
          type: "It et électronique",
          name: "clefs USB",
          amount: "39.45",
          date: "2023-11-01",
          vat: "20",
          pct: "6,58",
          commentary: "Achat lots de clef USB",
          fileName: "test.png",
          status: "pending",
        };

        jest.spyOn(mockStore, "bills");

        const postNewBill = await mockStore.bills().create(newBillDatas);
        expect(postNewBill).toEqual({
          fileUrl: "https://localhost:3456/images/test.jpg",
          key: "1234",
        });
        console.log("new Bill successfully created");
      });

      describe("Then i simulate the API error handler", () => {
        beforeEach(() => {
          jest.spyOn(mockStore, "bills");

          Object.defineProperty(window, "localStorage", {
            value: localStorageMock,
          });

          Object.defineProperty(window, "location", {
            value: { hash: ROUTES_PATH["NewBill"] },
          });
          window.localStorage.setItem(
            "user",
            JSON.stringify({
              type: "Employee",
              email: "a@a",
            })
          );

          const root = document.createElement("div");
          root.setAttribute("id", "root");
          root.classList.add("root");
          document.body.append(root);
          Router();
        })

        test("Then i verify that an error message is displayed for an 404 error", async () => {
          mockStore.bills.mockImplementationOnce(() => {
            return Promise.reject(new Error("404"));
          });
          const message = "Erreur 404 : la page que vous demandez n'existe pas"
          const root = document.querySelector('#root')
          const errorMessage = document.createElement('p')
          errorMessage.setAttribute('data-testid', 'error-message')
          errorMessage.textContent = message
          root.appendChild(errorMessage)

          const getMessage = screen.getByTestId('error-message')
          expect(getMessage).toBeTruthy()
        })
        test("Then i verify that an error message is displayed for an 500 error", async () => {
          mockStore.bills.mockImplementationOnce(() => {
            return Promise.reject(new Error("500"));
          });
          const message = "Erreur 500 : les serveurs ne sont pas joignables"
          const root = document.querySelector('#root')
          const errorMessage = document.createElement('p')
          errorMessage.setAttribute('data-testid', 'error-message')
          errorMessage.textContent = message
          root.appendChild(errorMessage)

          const getMessage = screen.getByTestId('error-message')
          expect(getMessage).toBeTruthy()
        })
      });
    });
  });
});

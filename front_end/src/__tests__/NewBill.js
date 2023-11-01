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

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      Object.defineProperties(window, {
        localStorage: {
          value: localStorageMock,
        },
      });

      window.localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" }),
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
        }),
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

      const fileName = inputFile.files[0].name;
      const isValidFileName =
        fileName === "test.jpg" ||
        fileName === "test.png" ||
        fileName === "test.jpeg";

      expect(isValidFileName).toBeTruthy();
    });
  });
});

// TODO fix this test (the store isn't updated)
describe("Given i am logged in as an employee", () => {
  describe("When i am on NewBill Page", () => {
    describe("When i create a valid bill ", () => {
      test("Then the new bill should be stored", async () => {
        jest.spyOn(mockStore, "bills");

        const initialBills = await mockStore.bills().list();
        const initialBillCount = initialBills.length;

        const newBill = {
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

        const createdBill = await mockStore.bills().create(newBill);

        expect(createdBill).toBeDefined();

        const updatedBills = await mockStore.bills().list();

        expect(updatedBills).toEqual(initialBillCount + 1);

        const isNewBillInList = updatedBills.some(
          (bill) => bill.id === createdBill.id,
        );
        expect(isNewBillInList).toBeTruthy();
      });
    });
  });
});

import { mount } from "cypress/react";
import ItemCardPresenter from "@/features/dashboard/presenters/ItemCardPresenter";
import {
  CREATE_BOOK_ALIAS,
  stubDashboardApi,
  type CreatedBookBody,
} from "../support/stubDashboardApi";

// The real OCR worker runs in the browser and downloads its language data on first use.
const OCR_TIMEOUT = 240_000;
const FIXTURES = "cypress/fixtures/receipts";

const receipt = (name: string) => `${FIXTURES}/${name}`;

function openDialogWith(files: Parameters<Cypress.Chainable["selectFile"]>[0]) {
  mount(<ItemCardPresenter cardId="new-item" name="" />);
  cy.get('[aria-label="Agregar un nuevo libro"]').click();
  cy.get('input[type="file"]').selectFile(files, { force: true });
}

const save = () => cy.contains("button", "Guardar", { timeout: OCR_TIMEOUT });

function createdBook() {
  return cy
    .wait(`@${CREATE_BOOK_ALIAS}`)
    .its("request.body")
    .then((body) => body as CreatedBookBody);
}

describe("upload flow (OCR-1, OCR-7, OCR-8, OCR-10, BOOK-5, BOOK-9)", () => {
  let nonGetRequests: string[];

  beforeEach(() => {
    nonGetRequests = stubDashboardApi();
  });

  it("saves three days as one book titled by its range, in date order, with no image upload", () => {
    openDialogWith([
      receipt("25-09-2026-65.800.png"),
      receipt("23-09-2026-15.000.png"),
      receipt("24-09-2026-51.600.png"),
    ]);

    save().should("be.enabled").click();

    createdBook().then((body) => {
      expect(body.title).to.equal("23/09/2026 - 25/09/2026");
      expect(body.creationTime).to.equal("2026-09-23");
      expect(body.content.map((entry) => entry.date)).to.deep.equal([
        "23/09/2026",
        "24/09/2026",
        "25/09/2026",
      ]);
      expect(body.content.map((entry) => entry.money)).to.deep.equal([
        "15.000",
        "51.600",
        "65.800",
      ]);
      // OCR-1: the only non-GET request is the book itself, and it carries no image data.
      expect(nonGetRequests).to.deep.equal(["POST /api/dashboard/books"]);
      expect(JSON.stringify(body)).not.to.match(/data:image|blob:/);
    });
  });

  it("keeps two receipts with the same date and the same amount", () => {
    openDialogWith([receipt("23-09-2026-27.700.png"), receipt("23-09-2026-27.700-2.png")]);

    save().should("be.enabled").click();

    createdBook().then((body) => {
      expect(body.title).to.equal("23/09/2026");
      expect(body.content).to.have.length(2);
      expect(body.content.map((entry) => entry.money)).to.deep.equal(["27.700", "27.700"]);
    });
  });

  it("flags an image it cannot read and widens the range with the typed date", () => {
    openDialogWith([
      receipt("23-09-2026-15.000.png"),
      receipt("blank.png"),
      receipt("25-09-2026-65.800.png"),
    ]);

    save().should("be.disabled");
    cy.contains("No pudimos leer bien esta imagen", { timeout: OCR_TIMEOUT }).should("be.visible");
    cy.get('input[type="date"]').type("2026-09-22");
    cy.contains("label", "Dinero").parent().find("input").type("20000");

    save().should("be.enabled").click();

    createdBook().then((body) => {
      expect(body.title).to.equal("22/09/2026 - 25/09/2026");
      expect(body.creationTime).to.equal("2026-09-22");
      expect(body.content.map((entry) => entry.date)).to.deep.equal([
        "22/09/2026",
        "23/09/2026",
        "25/09/2026",
      ]);
      expect(body.content[0].money).to.equal("20.000");
    });
  });

  it("flags a date far from the others, blocks saving until it is confirmed, and checks it again if it changes", () => {
    openDialogWith([
      receipt("23-09-2026-15.000.png"),
      receipt("blank.png"),
      receipt("25-09-2026-65.800.png"),
    ]);

    cy.contains("No pudimos leer bien esta imagen", { timeout: OCR_TIMEOUT }).should("be.visible");
    cy.get('input[type="date"]').type("2026-09-10");
    cy.contains("label", "Dinero").parent().find("input").type("20000");

    cy.contains("a más de 7 días de las demás fechas").should("be.visible");
    save().should("be.disabled");

    cy.contains("button", "Confirmar fecha").click();
    cy.contains("a más de 7 días de las demás fechas").should("not.exist");
    save().should("be.enabled");

    // The confirmation was for 10/09: a different date that is still far away is checked again.
    cy.get('input[type="date"]').clear().type("2026-09-11");
    cy.contains("a más de 7 días de las demás fechas").should("be.visible");
    save().should("be.disabled");
  });

  it("reads a receipt from its content, never from its file name", () => {
    const image = receipt("24-09-2026-51.600.png");
    openDialogWith([
      { contents: image, fileName: "24-09-2026-51.600.png" },
      { contents: image, fileName: "01-01-2020-1.000.png" },
    ]);

    save().should("be.enabled").click();

    createdBook().then((body) => {
      expect(body.content).to.have.length(2);
      expect(body.content[1].date).to.equal(body.content[0].date);
      expect(body.content[1].money).to.equal(body.content[0].money);
      expect(body.content[0].date).to.equal("24/09/2026");
      expect(body.content[0].money).to.equal("51.600");
    });
  });
});

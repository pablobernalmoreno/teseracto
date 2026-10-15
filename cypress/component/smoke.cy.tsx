import { mount } from "cypress/react";
import ItemCardPresenter from "@/features/dashboard/presenters/ItemCardPresenter";

describe("upload dialog smoke test", () => {
  it("mounts the new-book card and opens the upload dialog", () => {
    mount(<ItemCardPresenter cardId="new-item" name="" />);

    cy.get('[aria-label="Agregar una nueva planilla"]').click();

    cy.contains("Subir archivos").should("be.visible");
    cy.contains("button", "Guardar").should("be.disabled");
  });
});

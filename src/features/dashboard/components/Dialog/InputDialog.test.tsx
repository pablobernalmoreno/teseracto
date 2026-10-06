/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { EntryIssues } from "@/features/dashboard/model/reviewEntries";
import { InputDialog, type InputDialogProps } from "./InputDialog";

const ok: EntryIssues = { missingDate: false, missingAmount: false, dateOutlier: false };

function renderDialog(overrides: Partial<InputDialogProps> = {}) {
  const props: InputDialogProps = {
    open: true,
    dialogState: { type: "invalid_entries" },
    attentionEntries: [{ id: 1, date: "", money: "20.000" }],
    entryIssues: { 1: { ...ok, missingDate: true } },
    sources: ["blob:a", "blob:b", "blob:c", "blob:d"],
    rangeTitle: "23/09/2026 - 25/09/2026",
    canSave: false,
    activeEntryId: null,
    onClose: jest.fn(),
    onSave: jest.fn(),
    onFileChange: jest.fn(),
    onActiveEntryChange: jest.fn(),
    onDateChange: jest.fn(),
    onMoneyChange: jest.fn(),
    onConfirmDate: jest.fn(),
    inputRef: createRef<HTMLInputElement>(),
    ...overrides,
  };

  render(<InputDialog {...props} />);
  return props;
}

describe("InputDialog review", () => {
  it("shows the date field of the entry, found by its label", () => {
    renderDialog({ attentionEntries: [{ id: 1, date: "22/09/2026", money: "20.000" }] });

    expect(screen.getByLabelText("Fecha")).toHaveValue("2026-09-22");
    expect(screen.getByLabelText("Valor")).toHaveValue("20.000");
    expect(screen.queryByLabelText("Dinero")).not.toBeInTheDocument();
  });

  it("shows an empty date field and the missing-date message when the date is missing", () => {
    renderDialog();

    expect(screen.getByLabelText("Fecha")).toHaveValue("");
    expect(screen.getByText(/No pudimos leer la fecha de esta imagen/)).toBeInTheDocument();
  });

  it("reports a typed date as the date input value", () => {
    const props = renderDialog();

    fireEvent.change(screen.getByLabelText("Fecha"), { target: { value: "2026-09-22" } });

    expect(props.onDateChange).toHaveBeenCalledWith(1, "2026-09-22");
  });

  it("reports a typed amount for the entry", async () => {
    const props = renderDialog({ attentionEntries: [{ id: 1, date: "23/09/2026", money: "" }] });

    await userEvent.type(screen.getByLabelText("Valor"), "5");

    expect(props.onMoneyChange).toHaveBeenCalledWith(1, "5");
  });

  it("shows the title the book will get", () => {
    renderDialog();

    expect(
      screen.getByText("El libro se guardará como: 23/09/2026 - 25/09/2026")
    ).toBeInTheDocument();
  });

  it("says the book has no date yet when there is no range", () => {
    renderDialog({ rangeTitle: "" });

    expect(screen.getByText("El libro aún no tiene fecha")).toBeInTheDocument();
  });

  describe("date outlier", () => {
    const outlier = { ...ok, dateOutlier: true };

    it("offers a confirm button with an accessible name and the explanation", async () => {
      const props = renderDialog({
        attentionEntries: [{ id: 3, date: "24/09/2062", money: "40.000" }],
        entryIssues: { 3: outlier },
      });

      expect(screen.getByText(/a más de 7 días de las demás fechas/)).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Confirmar fecha" }));

      expect(props.onConfirmDate).toHaveBeenCalledWith(3);
    });

    it("does not offer the confirm button when the date is not an outlier", () => {
      renderDialog();

      expect(screen.queryByRole("button", { name: "Confirmar fecha" })).not.toBeInTheDocument();
    });
  });

  describe("Save", () => {
    it("is disabled until the upload can be saved", () => {
      renderDialog({ canSave: false });

      expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
    });

    it("is enabled once the upload can be saved and saves on click", async () => {
      const props = renderDialog({ canSave: true });

      const save = screen.getByRole("button", { name: "Guardar" });
      expect(save).toBeEnabled();
      await userEvent.click(save);

      expect(props.onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe("navigation between entries", () => {
    const entries = [
      { id: 1, date: "", money: "20.000" },
      { id: 3, date: "24/09/2062", money: "40.000" },
    ];
    const issues = { 1: { ...ok, missingDate: true }, 3: { ...ok, dateOutlier: true } };

    it("starts on the first entry and moves to the next by id", async () => {
      const props = renderDialog({ attentionEntries: entries, entryIssues: issues });

      expect(screen.getByText("Entrada 1 de 2")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Entrada siguiente" }));

      expect(props.onActiveEntryChange).toHaveBeenCalledWith(3);
    });

    it("follows the active entry by id and goes back to the previous one", async () => {
      const props = renderDialog({
        attentionEntries: entries,
        entryIssues: issues,
        activeEntryId: 3,
      });

      expect(screen.getByText("Entrada 2 de 2")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Entrada anterior" }));

      expect(props.onActiveEntryChange).toHaveBeenCalledWith(1);
    });

    it("falls back to the first entry when the active entry is no longer listed", () => {
      renderDialog({ attentionEntries: entries, entryIssues: issues, activeEntryId: 99 });

      expect(screen.getByText("Entrada 1 de 2")).toBeInTheDocument();
    });

    it("has no navigation for a single entry", () => {
      renderDialog();

      expect(screen.queryByRole("button", { name: "Entrada siguiente" })).not.toBeInTheDocument();
    });
  });

  it("lets the user open the enlarged image", async () => {
    renderDialog();

    await userEvent.click(
      screen.getByRole("button", { name: "Abrir vista ampliada de la imagen" })
    );

    expect(await screen.findByText("Vista ampliada")).toBeInTheDocument();
  });

  describe("enlarged image", () => {
    const openZoom = async () => {
      renderDialog();
      await userEvent.click(
        screen.getByRole("button", { name: "Abrir vista ampliada de la imagen" })
      );
      return screen.findByTestId("zoom-viewport");
    };

    // jsdom does no layout, so the cut-off itself can only be guarded on the rule that caused it:
    // centring an overflowing flex child with justify-content/align-items makes its top and left
    // unreachable by scrolling.
    it("does not centre the scrollable viewport with flex alignment", () => {
      const css = readFileSync(
        join(__dirname, "../InvalidEntryCarousel/InvalidEntryCarousel.module.css"),
        "utf8"
      );
      const viewportRule = (/\.zoomViewport\s*\{([^}]*)\}/.exec(css)?.[1] ?? "").replaceAll(
        /\/\*[\s\S]*?\*\//g,
        ""
      );

      expect(viewportRule).toMatch(/overflow:\s*auto/);
      expect(viewportRule).not.toMatch(/justify-content|align-items/);
    });

    it("zooms up to 400%", async () => {
      await openZoom();
      const zoomIn = screen.getByRole("button", { name: "Acercar imagen" });

      for (let step = 0; step < 12; step += 1) await userEvent.click(zoomIn);

      expect(screen.getByText("400%")).toBeInTheDocument();
      expect(zoomIn).toBeDisabled();
    });

    it("pans by dragging the image", async () => {
      const viewport = await openZoom();
      // jsdom has no PointerEvent, layout or scrolling: stand in for all three.
      class TestPointerEvent extends MouseEvent {
        pointerId: number;
        constructor(type: string, init: MouseEventInit & { pointerId?: number } = {}) {
          super(type, { bubbles: true, ...init });
          this.pointerId = init.pointerId ?? 1;
        }
      }
      Object.defineProperty(window, "PointerEvent", {
        value: TestPointerEvent,
        configurable: true,
      });
      Object.defineProperty(viewport, "setPointerCapture", { value: jest.fn() });
      Object.defineProperty(viewport, "scrollLeft", { value: 100, writable: true });
      Object.defineProperty(viewport, "scrollTop", { value: 50, writable: true });

      fireEvent.pointerDown(viewport, { clientX: 200, clientY: 200, pointerId: 1 });
      fireEvent.pointerMove(viewport, { clientX: 150, clientY: 180, pointerId: 1 });
      fireEvent.pointerUp(viewport, { pointerId: 1 });

      expect(viewport.scrollLeft).toBe(150);
      expect(viewport.scrollTop).toBe(70);
    });
  });
});

describe("InputDialog other states", () => {
  it("offers the file picker when idle", () => {
    renderDialog({ dialogState: { type: "idle" }, attentionEntries: [], entryIssues: {} });

    expect(screen.getByText("Subir Archivos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
  });

  it("allows saving from the success state when the upload can be saved", () => {
    renderDialog({
      dialogState: { type: "success" },
      attentionEntries: [],
      entryIssues: {},
      canSave: true,
    });

    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();
  });
});

describe("InputDialog save error", () => {
  it("shows why the save failed without leaving the review", () => {
    renderDialog({ saveError: "No se pudo guardar el libro." });

    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo guardar el libro.");
    expect(screen.getByLabelText("Fecha")).toBeInTheDocument();
  });

  it("shows no alert when the last save did not fail", () => {
    renderDialog({ saveError: null });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

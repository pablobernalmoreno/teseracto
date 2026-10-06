/**
 * @jest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";

const mockRecognize = jest.fn();
const mockTerminate = jest.fn(async () => undefined);
const mockSetParameters = jest.fn(async (..._args: unknown[]) => undefined);
const mockCreateWorker = jest.fn(async (..._args: unknown[]) => ({
  recognize: mockRecognize,
  setParameters: mockSetParameters,
  terminate: mockTerminate,
}));

jest.mock("tesseract.js", () => ({
  createWorker: (...args: unknown[]) => mockCreateWorker(...args),
  PSM: { SINGLE_BLOCK: "6", AUTO: "3", SPARSE_TEXT: "11" },
}));

jest.mock("./dashboardService", () => ({
  dashboardService: { fetchCurrentUserProfile: jest.fn(), insertBookData: jest.fn() },
}));

import { dashboardService } from "./dashboardService";
import { useItemCardModel } from "./useItemCardModel";

const insertBookData = jest.mocked(dashboardService.insertBookData);
const fetchCurrentUserProfile = jest.mocked(dashboardService.fetchCurrentUserProfile);

const receiptFile = (name = "receipt.png") => new File(["pixels"], name, { type: "image/png" });
const ocrText = (text: string) => ({ data: { text } });
const receiptText = (date: string | null, amount: string) =>
  [date, `Valor del pago $ ${amount}`].filter(Boolean).join("\n");

// Scripts what the OCR "reads" for each file name.
function scriptOcr(texts: Record<string, string>) {
  mockRecognize.mockImplementation(async (image: File) => ocrText(texts[image.name] ?? ""));
}

async function readFiles(
  result: ReturnType<typeof renderHook<ReturnType<typeof useItemCardModel>, unknown>>["result"],
  names: string[]
) {
  await act(async () => {
    await result.current[1].getImageText(names.map((name) => receiptFile(name)));
  });
}

describe("useItemCardModel", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    URL.createObjectURL = jest.fn(() => "blob:mock");
    URL.revokeObjectURL = jest.fn();
    fetchCurrentUserProfile.mockResolvedValue({
      data: { id: "u1", book_id: "owner-1" },
      error: null,
    });
    insertBookData.mockResolvedValue({ data: [{ id: "book-1", title: "x" }], error: null });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("reading images", () => {
    it("creates the OCR worker with the Spanish model", async () => {
      scriptOcr({ "a.png": receiptText("23 sept 2026", "15.000") });
      const { result } = renderHook(() => useItemCardModel());

      await readFiles(result, ["a.png"]);

      expect(mockCreateWorker).toHaveBeenCalledTimes(1);
      expect(mockCreateWorker.mock.calls[0][0]).toBe("spa");
    });

    it("reads every image locally: no request leaves the browser and the worker is terminated", async () => {
      scriptOcr({
        "a.png": receiptText("23 sept 2026", "15.000"),
        "b.png": receiptText("23 sept 2026", "20.000"),
      });
      const { result } = renderHook(() => useItemCardModel());

      await readFiles(result, ["a.png", "b.png"]);

      expect(mockRecognize).toHaveBeenCalledTimes(2);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(mockTerminate).toHaveBeenCalledTimes(1);
      expect(result.current[0].dialogState).toEqual({ type: "success" });
    });

    it("terminates the worker and falls back to manual entry when recognition throws", async () => {
      mockRecognize.mockRejectedValue(new Error("worker failed"));
      const { result } = renderHook(() => useItemCardModel());

      await readFiles(result, ["a.png", "b.png"]);

      expect(mockTerminate).toHaveBeenCalledTimes(1);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(result.current[0].dialogState).toEqual({ type: "invalid_entries" });
      expect(result.current[0].attentionEntries).toHaveLength(2);
      expect(result.current[0].canSave).toBe(false);
    });

    it("sets the page-reading mode before every pass, trying the other modes only when needed", async () => {
      scriptOcr({ "a.png": receiptText("23 sept 2026", "15.000"), "b.png": "ruido" });
      const { result } = renderHook(() => useItemCardModel());

      await readFiles(result, ["a.png", "b.png"]);

      const modes = mockSetParameters.mock.calls.map(([parameters]) => {
        return (parameters as { tessedit_pageseg_mode: string }).tessedit_pageseg_mode;
      });
      // a.png reads fully in the first (block) pass; b.png goes on through auto and sparse, and
      // its treated versions cannot be built in jsdom, so those passes are skipped.
      expect(modes).toEqual(["6", "6", "3", "11"]);
    });

    it("does not create a worker when no file is selected", async () => {
      const { result } = renderHook(() => useItemCardModel());

      await act(async () => {
        await result.current[1].getImageText([]);
      });

      expect(mockCreateWorker).not.toHaveBeenCalled();
      expect(result.current[0].dialogState).toEqual({ type: "idle" });
    });
  });

  describe("review (OCR-5, OCR-6, OCR-7, OCR-8)", () => {
    it("keeps every image when the dates differ", async () => {
      scriptOcr({
        "a.png": receiptText("23 sept 2026", "15.000"),
        "b.png": receiptText("24 sept 2026", "20.000"),
        "c.png": receiptText("25 sept 2026", "30.000"),
      });
      const { result } = renderHook(() => useItemCardModel());

      await readFiles(result, ["a.png", "b.png", "c.png"]);

      expect(result.current[0].entries.map((entry) => entry.date)).toEqual([
        "23/09/2026",
        "24/09/2026",
        "25/09/2026",
      ]);
      expect(result.current[0].dialogState).toEqual({ type: "success" });
      expect(result.current[0].attentionEntries).toEqual([]);
      expect(result.current[0].canSave).toBe(true);
      expect(result.current[0].rangeTitle).toBe("23/09/2026 - 25/09/2026");
    });

    it("flags only the image whose date is missing", async () => {
      scriptOcr({
        "a.png": receiptText("23 sept 2026", "15.000"),
        "b.png": receiptText(null, "20.000"),
        "c.png": receiptText("25 sept 2026", "30.000"),
      });
      const { result } = renderHook(() => useItemCardModel());

      await readFiles(result, ["a.png", "b.png", "c.png"]);

      const [state] = result.current;
      expect(state.dialogState).toEqual({ type: "invalid_entries" });
      expect(state.attentionEntries.map((entry) => entry.id)).toEqual([1]);
      expect(state.entryIssues.get(1)?.missingDate).toBe(true);
      expect(state.entryIssues.get(0)?.missingDate).toBe(false);
      expect(state.canSave).toBe(false);
    });

    it("flags only the image whose amount is missing", async () => {
      scriptOcr({
        "a.png": "23 sept 2026",
        "b.png": receiptText("23 sept 2026", "20.000"),
      });
      const { result } = renderHook(() => useItemCardModel());

      await readFiles(result, ["a.png", "b.png"]);

      expect(result.current[0].attentionEntries.map((entry) => entry.id)).toEqual([0]);
      expect(result.current[0].entryIssues.get(0)?.missingAmount).toBe(true);

      act(() => result.current[1].onMoneyChange(0, "51600"));

      expect(result.current[0].entryIssues.get(0)?.missingAmount).toBe(false);
      expect(result.current[0].canSave).toBe(true);
      // The entry stays in the carousel after it is fixed, so it does not vanish while typing.
      expect(result.current[0].attentionEntries.map((entry) => entry.id)).toEqual([0]);
    });

    it("blocks saving on an outlier until it is confirmed, and checks it again if the date changes", async () => {
      scriptOcr({
        "a.png": receiptText("23 sept 2026", "15.000"),
        "b.png": receiptText("24 sept 2026", "20.000"),
        "c.png": receiptText("25 sept 2026", "30.000"),
        "d.png": receiptText("24 sept 2062", "40.000"),
      });
      const { result } = renderHook(() => useItemCardModel());

      await readFiles(result, ["a.png", "b.png", "c.png", "d.png"]);

      expect(result.current[0].entryIssues.get(3)?.dateOutlier).toBe(true);
      expect(result.current[0].dialogState).toEqual({ type: "invalid_entries" });
      expect(result.current[0].canSave).toBe(false);

      act(() => result.current[1].onConfirmDate(3));
      expect(result.current[0].entryIssues.get(3)?.dateOutlier).toBe(false);
      expect(result.current[0].canSave).toBe(true);

      // A different date that is still far away is flagged again: the confirmation was for 2062.
      act(() => result.current[1].onDateChange(3, "2063-09-24"));
      expect(result.current[0].entryIssues.get(3)?.dateOutlier).toBe(true);
      expect(result.current[0].canSave).toBe(false);
    });

    it("flags a typed date that is far from the others", async () => {
      scriptOcr({
        "a.png": receiptText("23 sept 2026", "15.000"),
        "b.png": receiptText("24 sept 2026", "20.000"),
        "c.png": receiptText(null, "30.000"),
        "d.png": receiptText("25 sept 2026", "40.000"),
      });
      const { result } = renderHook(() => useItemCardModel());
      await readFiles(result, ["a.png", "b.png", "c.png", "d.png"]);

      act(() => result.current[1].onDateChange(2, "2026-09-10"));

      expect(result.current[0].entryIssues.get(2)?.dateOutlier).toBe(true);
      expect(result.current[0].canSave).toBe(false);
    });

    it("treats an incomplete date input as a missing date", async () => {
      scriptOcr({ "a.png": receiptText("23 sept 2026", "15.000") });
      const { result } = renderHook(() => useItemCardModel());
      await readFiles(result, ["a.png"]);

      act(() => result.current[1].onDateChange(0, ""));

      expect(result.current[0].entryIssues.get(0)?.missingDate).toBe(true);
      expect(result.current[0].canSave).toBe(false);
    });

    it("returns the same entries when an edit changes nothing", async () => {
      scriptOcr({ "a.png": receiptText("23 sept 2026", "15.000") });
      const { result } = renderHook(() => useItemCardModel());
      await readFiles(result, ["a.png"]);
      const before = result.current[0].entries;

      act(() => result.current[1].onMoneyChange(0, "15.000"));
      act(() => result.current[1].onDateChange(0, "2026-09-23"));
      act(() => result.current[1].onMoneyChange(99, "1"));

      expect(result.current[0].entries).toBe(before);
    });
  });

  describe("saving (BOOK-5, BOOK-9)", () => {
    it("saves a three-day upload titled by its range, in date order, dated by the lowest", async () => {
      scriptOcr({
        "c.png": receiptText("25 sept 2026", "65.800"),
        "a.png": receiptText("23 sept 2026", "15.000"),
        "b.png": receiptText("24 sept 2026", "51.600"),
      });
      const { result } = renderHook(() => useItemCardModel());
      await readFiles(result, ["c.png", "a.png", "b.png"]);

      let saved: unknown;
      await act(async () => {
        saved = await result.current[1].handleSave();
      });

      expect(insertBookData).toHaveBeenCalledTimes(1);
      const [title, content, bookId, creationTime] = insertBookData.mock.calls[0];
      expect(title).toBe("23/09/2026 - 25/09/2026");
      expect(creationTime).toBe("2026-09-23");
      expect(typeof bookId).toBe("string");
      expect(content.map((entry) => entry.date)).toEqual([
        "23/09/2026",
        "24/09/2026",
        "25/09/2026",
      ]);
      expect(content.map((entry) => entry.money)).toEqual(["15.000", "51.600", "65.800"]);
      expect(saved).toEqual({ id: "book-1", title: "x" });
      expect(result.current[0].dialogState).toEqual({ type: "idle" });
    });

    it("titles a single-day upload with that date", async () => {
      scriptOcr({
        "a.png": receiptText("23 sept 2026", "15.000"),
        "b.png": receiptText("23 sept 2026", "20.000"),
      });
      const { result } = renderHook(() => useItemCardModel());
      await readFiles(result, ["a.png", "b.png"]);

      await act(async () => {
        await result.current[1].handleSave();
      });

      const [title, content, , creationTime] = insertBookData.mock.calls[0];
      expect(title).toBe("23/09/2026");
      expect(creationTime).toBe("2026-09-23");
      // Same date: upload order is kept.
      expect(content.map((entry) => entry.id)).toEqual([0, 1]);
    });

    it("widens the range when the user types an earlier date", async () => {
      scriptOcr({
        "a.png": receiptText("23 sept 2026", "15.000"),
        "b.png": receiptText(null, "20.000"),
        "c.png": receiptText("25 sept 2026", "30.000"),
      });
      const { result } = renderHook(() => useItemCardModel());
      await readFiles(result, ["a.png", "b.png", "c.png"]);
      expect(result.current[0].rangeTitle).toBe("23/09/2026 - 25/09/2026");

      act(() => result.current[1].onDateChange(1, "2026-09-22"));
      expect(result.current[0].rangeTitle).toBe("22/09/2026 - 25/09/2026");

      await act(async () => {
        await result.current[1].handleSave();
      });

      const [title, content, , creationTime] = insertBookData.mock.calls[0];
      expect(title).toBe("22/09/2026 - 25/09/2026");
      expect(creationTime).toBe("2026-09-22");
      expect(content.map((entry) => entry.id)).toEqual([1, 0, 2]);
    });

    it("creates a new book for every upload, even when the dates overlap an earlier one", async () => {
      scriptOcr({ "a.png": receiptText("23 sept 2026", "15.000") });
      const { result } = renderHook(() => useItemCardModel());

      for (let upload = 0; upload < 2; upload += 1) {
        await readFiles(result, ["a.png"]);
        await act(async () => {
          await result.current[1].handleSave();
        });
      }

      // Two inserts of the same date range, each with its own book id; nothing is merged or updated.
      expect(insertBookData).toHaveBeenCalledTimes(2);
      const [first, second] = insertBookData.mock.calls;
      expect(first[0]).toBe(second[0]);
      expect(first[2]).not.toBe(second[2]);
    });

    it("saves nothing and keeps the dialog open when the upload cannot be saved yet", async () => {
      scriptOcr({
        "a.png": receiptText("23 sept 2026", "15.000"),
        "b.png": receiptText(null, "20.000"),
      });
      const { result } = renderHook(() => useItemCardModel());
      await readFiles(result, ["a.png", "b.png"]);

      let saved: unknown = "untouched";
      await act(async () => {
        saved = await result.current[1].handleSave();
      });

      expect(saved).toBeNull();
      expect(insertBookData).not.toHaveBeenCalled();
      expect(result.current[0].dialogState).toEqual({ type: "invalid_entries" });
    });

    it("fails closed on a save failure: rethrows, keeps the reviewed entries and the dialog, and reports the error", async () => {
      scriptOcr({ "a.png": receiptText("23 sept 2026", "15.000") });
      fetchCurrentUserProfile.mockResolvedValue({ data: null, error: { message: "nope" } });
      const { result } = renderHook(() => useItemCardModel());
      await readFiles(result, ["a.png"]);
      const reviewed = result.current[0].entries;

      await act(async () => {
        await expect(result.current[1].handleSave()).rejects.toThrow("User profile not found");
      });

      expect(insertBookData).not.toHaveBeenCalled();
      expect(result.current[0].dialogState).not.toEqual({ type: "idle" });
      expect(result.current[0].entries).toBe(reviewed);
      expect(result.current[0].saveError).toMatch(/No se pudo guardar/);
    });

    it("lets the user retry after a failed save, and clears the error once it succeeds", async () => {
      scriptOcr({ "a.png": receiptText("23 sept 2026", "15.000") });
      fetchCurrentUserProfile.mockResolvedValueOnce({ data: null, error: { message: "nope" } });
      const { result } = renderHook(() => useItemCardModel());
      await readFiles(result, ["a.png"]);

      await act(async () => {
        await expect(result.current[1].handleSave()).rejects.toThrow();
      });
      fetchCurrentUserProfile.mockResolvedValue({ data: { book_id: "owner-1" }, error: null });
      await act(async () => {
        await result.current[1].handleSave();
      });

      expect(insertBookData).toHaveBeenCalledTimes(1);
      expect(result.current[0].saveError).toBeNull();
      expect(result.current[0].dialogState).toEqual({ type: "idle" });
    });
  });
});

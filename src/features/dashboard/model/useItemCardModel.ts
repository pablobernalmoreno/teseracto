import { useEffect, useMemo, useState } from "react";
import { dashboardService } from "./dashboardService";
import type { BookData } from "@/app/actions/dashboard";
import { browserCodec } from "@/lib/receipts/browserCodec";
import { createTreatments } from "@/lib/receipts/imageTreatments";
import { dateRangeTitle, isoToDisplay } from "@/lib/receipts/dates";
import { buildReadPasses, type PageMode } from "@/lib/receipts/readPasses";
import { readReceipt, type ReceiptRead } from "@/lib/receipts/readReceipt";
import type { MainData } from "@/types/dashboard";
import {
  attentionEntries,
  buildBookFromEntries,
  canSaveEntries,
  entriesFromReads,
  getEntryIssues,
  needsAttention,
  unreadableEntries,
  type EntryIssues,
} from "./reviewEntries";

// Format date for display as dd/mm/yyyy
export const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return "--/--/----";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, "0");
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const y = parsed.getFullYear();
    return `${d}/${m}/${y}`;
  }

  return dateStr;
};

// Format numeric-like strings into a thousands-separated string (no rounding)
export const formatCurrency = (raw: string | number): string => {
  const parseNumberParts = (s: string | number) => {
    if (typeof s === "number") {
      return { intPart: String(Math.trunc(s)), fracPart: undefined };
    }

    const str = String(s || "").trim();
    if (!str) return { intPart: "", fracPart: undefined };

    const cleaned = str.replaceAll(/[^0-9.,-]/g, "");
    if (!cleaned) return { intPart: "", fracPart: undefined };

    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");

    if (lastComma === -1 && lastDot === -1) {
      return { intPart: cleaned, fracPart: undefined };
    }

    if (lastComma > -1 && lastDot === -1) {
      const decimalsLen = cleaned.length - lastComma - 1;
      if (decimalsLen === 3) {
        return { intPart: cleaned.replaceAll(",", ""), fracPart: undefined };
      }
      return {
        intPart: cleaned.slice(0, lastComma).replaceAll(".", ""),
        fracPart: cleaned.slice(lastComma + 1),
      };
    }

    if (lastDot > -1 && lastComma === -1) {
      const decimalsLen = cleaned.length - lastDot - 1;
      if (decimalsLen === 3) {
        return { intPart: cleaned.replaceAll(".", ""), fracPart: undefined };
      }
      return {
        intPart: cleaned.slice(0, lastDot).replaceAll(",", ""),
        fracPart: cleaned.slice(lastDot + 1),
      };
    }

    if (lastComma > lastDot) {
      return {
        intPart: cleaned.slice(0, lastComma).replaceAll(".", ""),
        fracPart: cleaned.slice(lastComma + 1),
      };
    }

    return {
      intPart: cleaned.slice(0, lastDot).replaceAll(",", ""),
      fracPart: cleaned.slice(lastDot + 1),
    };
  };

  const parts = parseNumberParts(raw);
  const intFormatted = parts.intPart.replaceAll(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.fracPart ? `${intFormatted}.${parts.fracPart}` : intFormatted;
};

// Dialog state machine types
export type DialogState =
  { type: "idle" } | { type: "loading" } | { type: "invalid_entries" } | { type: "success" };

const OCR_FAILED_LOG = "OCR worker failed:";

// Returns the same array when nothing changes, so a no-op edit does not re-render.
function updateEntry(
  entries: MainData[],
  entryId: number,
  patch: Partial<Pick<MainData, "date" | "money">>
): MainData[] {
  const index = entries.findIndex((entry) => entry.id === entryId);
  if (index === -1) return entries;

  const current = entries[index];
  const next = { ...current, ...patch };
  if (next.date === current.date && next.money === current.money) return entries;

  return entries.map((entry, position) => (position === index ? next : entry));
}

interface ItemCardModelState {
  files: File[] | undefined;
  dialogState: DialogState;
  // One entry per image with its current date and amount ("" when missing).
  entries: MainData[];
  sources: string[];
  // The entries the carousel lists, and what is wrong with each of them.
  attentionEntries: MainData[];
  entryIssues: Map<number, EntryIssues>;
  // Title the book will get: the range from the lowest to the highest entry date.
  rangeTitle: string;
  canSave: boolean;
  // The carousel follows an entry by id, so it stays put when the listed entries change.
  activeEntryId: number | null;
}

interface ItemCardModelActions {
  setFiles: (files: File[]) => void;
  handleDialogClose: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getImageText: (selectedFiles: File[]) => Promise<void>;
  handleSave: () => Promise<BookData | null>;
  setActiveEntryId: (entryId: number | null) => void;
  onMoneyChange: (entryId: number, value: string) => void;
  // `value` is the `yyyy-MM-dd` value of a date input; an incomplete or invalid one clears the date.
  onDateChange: (entryId: number, value: string) => void;
  onConfirmDate: (entryId: number) => void;
}

export const useItemCardModel = (): [ItemCardModelState, ItemCardModelActions] => {
  const [files, setFiles] = useState<File[]>();
  const [dialogState, setDialogState] = useState<DialogState>({ type: "idle" });
  const [entries, setEntries] = useState<MainData[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [activeEntryId, setActiveEntryId] = useState<number | null>(null);
  const [initialAttention, setInitialAttention] = useState<Set<number>>(new Set());
  // id -> the date the user confirmed; stale as soon as that entry's date changes.
  const [confirmedDates, setConfirmedDates] = useState<Map<number, string>>(new Map());

  const entryIssues = useMemo(
    () => getEntryIssues(entries, confirmedDates),
    [entries, confirmedDates]
  );
  const listedEntries = useMemo(
    () => attentionEntries(entries, entryIssues, initialAttention),
    [entries, entryIssues, initialAttention]
  );
  const rangeTitle = useMemo(() => dateRangeTitle(entries.map((entry) => entry.date)), [entries]);
  const isReviewable = dialogState.type === "invalid_entries" || dialogState.type === "success";
  const canSave = isReviewable && canSaveEntries(entries, entryIssues);

  useEffect(() => {
    return () => {
      for (const source of sources) {
        URL.revokeObjectURL(source);
      }
    };
  }, [sources]);

  const handleDialogClose = () => {
    setDialogState({ type: "idle" });
    setFiles(undefined);
    setSources([]);
    setEntries([]);
    setActiveEntryId(null);
    setInitialAttention(new Set());
    setConfirmedDates(new Map());
  };

  const showReview = (reviewEntries: MainData[], reviewSources: string[]) => {
    const issues = getEntryIssues(reviewEntries, new Map());
    const flagged = new Set(
      reviewEntries
        .filter((entry) => {
          const entryIssuesAtRead = issues.get(entry.id);
          return entryIssuesAtRead ? needsAttention(entryIssuesAtRead) : false;
        })
        .map((entry) => entry.id)
    );

    setSources(reviewSources);
    setEntries(reviewEntries);
    setActiveEntryId(null);
    setInitialAttention(flagged);
    setConfirmedDates(new Map());
    setDialogState(flagged.size ? { type: "invalid_entries" } : { type: "success" });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const selectedFiles = Array.from(target.files ?? []);
    if (selectedFiles.length) {
      setFiles(selectedFiles);
      target.value = "";
      void getImageText(selectedFiles);
    }
  };

  const getImageText = async (selectedFiles: File[]) => {
    if (!selectedFiles.length) return;

    let worker: Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>> | null = null;

    try {
      setDialogState({ type: "loading" });
      const { createWorker, PSM } = await import("tesseract.js");
      // Receipts are in Spanish (labels, accented month names), so read with the Spanish model.
      const recognizer = await createWorker("spa");
      worker = recognizer;
      const segmentation: Record<PageMode, (typeof PSM)[keyof typeof PSM]> = {
        block: PSM.SINGLE_BLOCK,
        auto: PSM.AUTO,
        sparse: PSM.SPARSE_TEXT,
      };
      // The mode is set on every pass, so a pass never inherits the previous one's.
      const recognize = async (image: File | Blob, mode: PageMode) => {
        await recognizer.setParameters({ tessedit_pageseg_mode: segmentation[mode] });
        return (await recognizer.recognize(image)).data.text;
      };

      const reads: ReceiptRead[] = [];
      const newSources: string[] = [];

      for (const file of selectedFiles) {
        reads.push(
          await readReceipt(buildReadPasses(file, recognize, createTreatments(file, browserCodec)))
        );
        newSources.push(URL.createObjectURL(file));
      }

      showReview(entriesFromReads(reads), newSources);
    } catch (error) {
      // Fails open to manual entry (OCR-6): every image is flagged for a typed date and amount and
      // the user can still save.
      console.error(OCR_FAILED_LOG, error);
      showReview(
        unreadableEntries(selectedFiles.length),
        selectedFiles.map((file) => URL.createObjectURL(file))
      );
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  };

  const validateCurrentProfile = async (): Promise<void> => {
    const { data: currentProfile, error } = await dashboardService.fetchCurrentUserProfile();
    if (error || !currentProfile?.book_id) {
      throw new Error("User profile not found");
    }
  };

  const handleSave = async () => {
    // Complement of a saveable upload: the dialog stays open and nothing is written. The Save
    // button is disabled in this state, so this only guards against a stray call.
    const book = canSave ? buildBookFromEntries(entries) : null;
    if (!book) return null;

    try {
      await validateCurrentProfile();
      const bookId = globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : String(Date.now());

      const result = await dashboardService.insertBookData(
        book.title,
        book.content,
        bookId,
        book.creationTime
      );
      return result.data && result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
      console.error("Error saving book data:", error);
      throw error;
    } finally {
      handleDialogClose();
    }
  };

  const onMoneyChange = (entryId: number, value: string) => {
    setEntries((previous) => updateEntry(previous, entryId, { money: value }));
  };

  const onDateChange = (entryId: number, value: string) => {
    setEntries((previous) => updateEntry(previous, entryId, { date: isoToDisplay(value) }));
  };

  const onConfirmDate = (entryId: number) => {
    const entry = entries.find((item) => item.id === entryId);
    if (!entry || !entryIssues.get(entryId)?.dateOutlier) return;

    setConfirmedDates((previous) =>
      previous.get(entryId) === entry.date ? previous : new Map(previous).set(entryId, entry.date)
    );
  };

  const state: ItemCardModelState = {
    files,
    dialogState,
    entries,
    sources,
    attentionEntries: listedEntries,
    entryIssues,
    rangeTitle,
    canSave,
    activeEntryId,
  };

  const actions: ItemCardModelActions = {
    setFiles,
    handleDialogClose,
    onFileChange,
    getImageText,
    handleSave,
    setActiveEntryId,
    onMoneyChange,
    onDateChange,
    onConfirmDate,
  };

  return [state, actions];
};

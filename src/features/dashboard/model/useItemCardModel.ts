import { useState, useEffect, useCallback } from "react";
import { dashboardService } from "./dashboardService";
import type { BookData } from "@/app/actions/dashboard";
import { extractCurrencyValues, parseDates } from "@/app/utils/data";
import type { MainData } from "@/types/dashboard";

// Format date for display as dd/mm/yyyy
export const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return "--/--/----";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
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

    const cleaned = str.replace(/[^0-9.,-]/g, "");
    if (!cleaned) return { intPart: "", fracPart: undefined };

    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");

    if (lastComma === -1 && lastDot === -1) {
      return { intPart: cleaned, fracPart: undefined };
    }

    if (lastComma > -1 && lastDot === -1) {
      const decimalsLen = cleaned.length - lastComma - 1;
      if (decimalsLen === 3) {
        return { intPart: cleaned.replace(/,/g, ""), fracPart: undefined };
      }
      return {
        intPart: cleaned.slice(0, lastComma).replace(/\./g, ""),
        fracPart: cleaned.slice(lastComma + 1),
      };
    }

    if (lastDot > -1 && lastComma === -1) {
      const decimalsLen = cleaned.length - lastDot - 1;
      if (decimalsLen === 3) {
        return { intPart: cleaned.replace(/\./g, ""), fracPart: undefined };
      }
      return {
        intPart: cleaned.slice(0, lastDot).replace(/,/g, ""),
        fracPart: cleaned.slice(lastDot + 1),
      };
    }

    if (lastComma > lastDot) {
      return {
        intPart: cleaned.slice(0, lastComma).replace(/\./g, ""),
        fracPart: cleaned.slice(lastComma + 1),
      };
    }

    return {
      intPart: cleaned.slice(0, lastDot).replace(/,/g, ""),
      fracPart: cleaned.slice(lastDot + 1),
    };
  };

  const parts = parseNumberParts(raw);
  const intFormatted = parts.intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.fracPart ? `${intFormatted}.${parts.fracPart}` : intFormatted;
};

interface ParsedUploadState {
  pathData: MainData[];
  invalidEntries: MainData[];
  editedValues: Map<number, { money: string }>;
  excludedIds: Set<number>;
  messages: Map<number, string>;
  selectedDate: string;
}

function buildParsedUploadState(
  expectedDatesArray: (string | null)[],
  expectedCurrencyArray: string[],
  totalEntries: number
): ParsedUploadState {
  const referenceDate = expectedDatesArray[0] ?? null;
  const pathData: MainData[] = [];
  const invalidEntries: MainData[] = [];
  const editedValues = new Map<number, { money: string }>();
  const excludedIds = new Set<number>();
  const messages = new Map<number, string>();

  if (referenceDate) {
    for (let i = 0; i < totalEntries; i += 1) {
      const detectedDate = expectedDatesArray[i];
      const money = expectedCurrencyArray[i] || "N/A";
      const normalizedEntry: MainData = { id: i, date: referenceDate, money };
      pathData.push(normalizedEntry);

      const isDifferentDate = Boolean(detectedDate && detectedDate !== referenceDate);
      if (isDifferentDate) {
        invalidEntries.push(normalizedEntry);
        excludedIds.add(i);
        messages.set(
          i,
          `Imagen con fecha ${detectedDate}. Solo se guardan datos del dia ${referenceDate}.`
        );
        continue;
      }

      if (!money || money === "N/A") {
        invalidEntries.push(normalizedEntry);
        editedValues.set(i, { money: "" });
        messages.set(i, "Ingresa el valor de dinero para guardar esta imagen.");
      }
    }

    return {
      pathData,
      invalidEntries,
      editedValues,
      excludedIds,
      messages,
      selectedDate: referenceDate,
    };
  }

  for (let i = 0; i < totalEntries; i += 1) {
    const money = expectedCurrencyArray[i] || "N/A";
    pathData.push({ id: i, date: "N/A", money });
    invalidEntries.push({ id: i, date: "N/A", money });
    excludedIds.add(i);
    messages.set(i, "No se detecto fecha en la primera imagen. Esta imagen no se guardara.");
  }

  return {
    pathData,
    invalidEntries,
    editedValues,
    excludedIds,
    messages,
    selectedDate: "",
  };
}

// Dialog state machine types
export type DialogState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "invalid_entries" }
  | { type: "success" };

interface ItemCardModelState {
  files: File[] | undefined;
  dialogState: DialogState;
  pathData: MainData[];
  sources: string[];
  invalidEntries: MainData[];
  carouselIndex: number;
  editedValues: Map<number, { money: string }>;
  selectedDate: string;
  excludedEntryIds: Set<number>;
  entryMessages: Map<number, string>;
}

interface ItemCardModelActions {
  setFiles: (files: File[]) => void;
  handleDialogClose: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getImageText: () => Promise<void>;
  handleSave: () => Promise<BookData | null>;
  setCarouselIndex: (index: number) => void;
  onMoneyChange: (entryId: number, value: string) => void;
}

export const useItemCardModel = (): [ItemCardModelState, ItemCardModelActions] => {
  const [files, setFiles] = useState<File[]>();
  const [dialogState, setDialogState] = useState<DialogState>({ type: "idle" });
  const [pathData, setPathData] = useState<MainData[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [invalidEntries, setInvalidEntries] = useState<MainData[]>([]);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [editedValues, setEditedValues] = useState<Map<number, { money: string }>>(new Map());
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [excludedEntryIds, setExcludedEntryIds] = useState<Set<number>>(new Set());
  const [entryMessages, setEntryMessages] = useState<Map<number, string>>(new Map());

  const handleDialogClose = () => {
    setDialogState({ type: "idle" });
    setFiles(undefined);
    setInvalidEntries([]);
    setCarouselIndex(0);
    setEditedValues(new Map());
    setSelectedDate("");
    setExcludedEntryIds(new Set());
    setEntryMessages(new Map());
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const selectedFiles = Array.from(target.files ?? []);
    if (selectedFiles.length) {
      setFiles(selectedFiles);
      target.value = "";
    }
  };

  const getImageText = useCallback(async () => {
    if (!files?.length) return;

    let worker: Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>> | null = null;

    try {
      setDialogState({ type: "loading" });
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker("eng");

      const paths: string[] = [];
      const newSources: string[] = [];

      for (let i = 0; i < files.length; ++i) {
        const file = files[i];
        const ret = await worker.recognize(file);
        const ocrText = ret.data.text;
        newSources.push(URL.createObjectURL(file));
        paths.push(ocrText);
      }

      setSources(newSources);
      const expectedDatesArray = parseDates(paths);
      const expectedCurrencyArray = extractCurrencyValues(paths);
      const parsedUploadState = buildParsedUploadState(
        expectedDatesArray,
        expectedCurrencyArray,
        paths.length
      );

      setPathData(parsedUploadState.pathData);
      setInvalidEntries(parsedUploadState.invalidEntries);
      setEditedValues(parsedUploadState.editedValues);
      setExcludedEntryIds(parsedUploadState.excludedIds);
      setEntryMessages(parsedUploadState.messages);
      setSelectedDate(parsedUploadState.selectedDate);
      setDialogState(
        parsedUploadState.invalidEntries.length ? { type: "invalid_entries" } : { type: "success" }
      );
    } catch (error) {
      console.error("OCR worker failed:", error);
      setDialogState({ type: "idle" });
    } finally {
      if (worker) {
        await worker.terminate();
      }
    }
  }, [files]);

  const formatUpdatedPathData = (
    originalPathData: MainData[],
    edits: Map<number, { money: string }>
  ): MainData[] => {
    const updated = [...originalPathData];
    const parseNumberFromString = (s: string | number): number => {
      if (typeof s === "number") return s;
      const str = String(s || "").trim();
      if (!str) return 0;
      const cleaned = str.replace(/[^0-9.,-]/g, "");
      if (!cleaned) return 0;

      const lastComma = cleaned.lastIndexOf(",");
      const lastDot = cleaned.lastIndexOf(".");

      if (lastComma === -1 && lastDot === -1) return Number(cleaned) || 0;

      if (lastComma > -1 && lastDot === -1) {
        const decimalsLen = cleaned.length - lastComma - 1;
        if (decimalsLen === 3) {
          return Number(cleaned.replace(/,/g, "")) || 0;
        }
        return Number(cleaned.replace(/,/g, ".")) || 0;
      }

      if (lastDot > -1 && lastComma === -1) {
        const decimalsLen = cleaned.length - lastDot - 1;
        if (decimalsLen === 3) {
          return Number(cleaned.replace(/\./g, "")) || 0;
        }
        return Number(cleaned) || 0;
      }

      if (lastComma > lastDot) {
        const normalized = cleaned.replace(/\./g, "").replace(/,/g, ".");
        return Number(normalized) || 0;
      } else {
        const normalized = cleaned.replace(/,/g, "");
        return Number(normalized) || 0;
      }
    };
    edits.forEach((value, entryId) => {
      if (entryId !== undefined) {
        const formattedMoney = value.money
          ? parseNumberFromString(value.money).toLocaleString("es-CO", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })
          : updated[entryId].money;

        updated[entryId] = {
          ...updated[entryId],
          money: formattedMoney,
        };
      }
    });
    return updated;
  };

  const computeTitleFromDate = (date: string): string => {
    if (!date) return "Dia sin fecha";
    return `Dia ${date}`;
  };

  const validateRequiredMoney = (updatedPathData: MainData[]): boolean => {
    const missingMoney = updatedPathData.filter(
      (entry) => !excludedEntryIds.has(entry.id) && (!entry.money || entry.money === "N/A")
    );

    if (missingMoney.length) {
      setInvalidEntries((previous) => {
        const existingById = new Map(previous.map((item) => [item.id, item]));
        for (const item of missingMoney) {
          existingById.set(item.id, item);
        }
        return Array.from(existingById.values());
      });
      return false;
    }

    setInvalidEntries((previous) => previous.filter((entry) => excludedEntryIds.has(entry.id)));
    return true;
  };

  const validateCurrentProfile = async (): Promise<void> => {
    const { data: currentProfile, error } = await dashboardService.fetchCurrentUserProfile();
    if (error || !currentProfile?.book_id) {
      throw new Error("User profile not found");
    }
  };

  const handleSave = async () => {
    try {
      const updatedPathData = formatUpdatedPathData(pathData, editedValues);
      setPathData(updatedPathData);

      if (!validateRequiredMoney(updatedPathData)) {
        return null;
      }

      const saveableEntries = updatedPathData.filter(
        (entry) => !excludedEntryIds.has(entry.id) && entry.money && entry.money !== "N/A"
      );

      if (!saveableEntries.length) {
        return null;
      }

      await validateCurrentProfile();
      const bookId = globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : String(Date.now());
      const title = computeTitleFromDate(selectedDate);

      const result = await dashboardService.insertBookData(title, saveableEntries, bookId);
      return result.data && result.data.length > 0 ? result.data[0] : null;
    } catch (error) {
      console.error("Error saving book data:", error);
      throw error;
    } finally {
      handleDialogClose();
    }
  };

  const onMoneyChange = (entryId: number, value: string) => {
    const newEdited = new Map(editedValues);
    newEdited.set(entryId, {
      money: value,
    });
    setEditedValues(newEdited);
  };

  useEffect(() => {
    if (files?.length && files.length !== 0) {
      getImageText();
    }
  }, [files, getImageText]);

  const state: ItemCardModelState = {
    files,
    dialogState,
    pathData,
    sources,
    invalidEntries,
    carouselIndex,
    editedValues,
    selectedDate,
    excludedEntryIds,
    entryMessages,
  };

  const actions: ItemCardModelActions = {
    setFiles,
    handleDialogClose,
    onFileChange,
    getImageText,
    handleSave,
    setCarouselIndex,
    onMoneyChange,
  };

  return [state, actions];
};

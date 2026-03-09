import { useState, useEffect } from "react";
import { createWorker } from "tesseract.js";
import { dashboardService } from "./dashboardService";
import {
  combineDatesAndCurrency,
  extractCurrencyValues,
  findInvalidEntries,
  getValidFieldsFromInvalidEntries,
  isCombinedDataValid,
  parseDates,
} from "@/app/utils/data";

export interface MainData {
  date: string;
  money: string;
  id: number;
}

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

// Dialog state machine types
export type DialogState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "invalid_entries" }
  | { type: "success" };

interface ItemCardModelState {
  files: FileList | undefined;
  dialogState: DialogState;
  pathData: MainData[];
  sources: string[];
  invalidEntries: MainData[];
  carouselIndex: number;
  editedValues: Map<number, { date: string; money: string }>;
}

interface ItemCardModelActions {
  setFiles: (files: FileList) => void;
  handleDialogClose: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getImageText: () => Promise<void>;
  handleSave: () => Promise<void>;
  setCarouselIndex: (index: number) => void;
  onDateChange: (entryId: number, value: string) => void;
  onMoneyChange: (entryId: number, value: string) => void;
}


export const useItemCardModel = (): [
  ItemCardModelState,
  ItemCardModelActions,
] => {
  const [files, setFiles] = useState<FileList>();
  const [dialogState, setDialogState] = useState<DialogState>({ type: "idle" });
  const [pathData, setPathData] = useState<MainData[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [invalidEntries, setInvalidEntries] = useState<MainData[]>([]);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [editedValues, setEditedValues] = useState<
    Map<number, { date: string; money: string }>
  >(new Map());

  const handleDialogClose = () => {
    setDialogState({ type: "idle" });
    setFiles(undefined);
    setInvalidEntries([]);
    setCarouselIndex(0);
    setEditedValues(new Map());
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const file = target.files as FileList;
    if (file) {
      setFiles(file);
    }
  };

  const getImageText = async () => {
    const worker = await createWorker("eng");
    const paths: string[] = [];
    const newSources: string[] = [];
    if (files?.length) {
      setDialogState({ type: "loading" });
      for (let i = 0; i < files?.length; ++i) {
        const file = files[i];
        const ret = await worker.recognize(file);
        const ocrText = ret.data.text;
        newSources.push(URL.createObjectURL(file));
        paths.push(ocrText);
      }
      setSources(newSources);
      const expectedDatesArray = parseDates(paths);
      const expectedCurrencyArray = extractCurrencyValues(paths);
      const result = combineDatesAndCurrency(
        expectedDatesArray,
        expectedCurrencyArray,
      );

      if (!isCombinedDataValid(result)) {
        const invalid = findInvalidEntries(result);
        setInvalidEntries(invalid);

        // Pre-populate carousel with valid fields from invalid entries
        const validFields = getValidFieldsFromInvalidEntries(result);
        setEditedValues(validFields);
        setDialogState({ type: "invalid_entries" });
      } else {
        setDialogState({ type: "success" });
      }

      setPathData(result);
    }
    await worker.terminate();
  };

  const formatUpdatedPathData = (
    originalPathData: MainData[],
    edits: Map<number, { date: string; money: string }>,
  ): MainData[] => {
    const updated = [...originalPathData];
    const parseNumberFromString = (s: string | number): number => {
      if (typeof s === "number") return s;
      let str = String(s || "").trim();
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
        const formattedDate = value.date
          ? value.date.split("-").reverse().join("/")
          : updated[entryId].date;

        const formattedMoney = value.money
          ? parseNumberFromString(value.money).toLocaleString("es-CO", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })
          : updated[entryId].money;

        updated[entryId] = {
          ...updated[entryId],
          date: formattedDate,
          money: formattedMoney,
        };
      }
    });
    return updated;
  };

  const computeTitleFromPathData = (updatedPathData: MainData[]): string => {
    const dateStrings = updatedPathData
      .map((d) => d.date)
      .filter(Boolean) as string[];

    const toDate = (s: string): Date | null => {
      if (!s) return null;
      const ymd = /^\d{4}-\d{2}-\d{2}$/;
      const dmy = /^\d{2}\/\d{2}\/\d{4}$/;
      if (ymd.test(s)) {
        const [y, m, day] = s.split("-");
        return new Date(Number(y), Number(m) - 1, Number(day));
      } else if (dmy.test(s)) {
        const [day, month, year] = s.split("/");
        return new Date(Number(year), Number(month) - 1, Number(day));
      } else {
        const parsed = new Date(s);
        return isNaN(parsed.getTime()) ? null : parsed;
      }
    };

    const dates = dateStrings
      .map(toDate)
      .filter((d): d is Date => d instanceof Date && !isNaN(d.getTime()));

    if (!dates.length) return "Sin fechas";

    const times = dates.map((d) => d.getTime());
    const min = new Date(Math.min(...times));
    const max = new Date(Math.max(...times));
    const fmt = (d: Date) =>
      [
        String(d.getDate()).padStart(2, "0"),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getFullYear()),
      ].join("/");
    return `Del ${fmt(min)} al ${fmt(max)}`;
  };

  const validateAllEntriesPresent = (updatedPathData: MainData[]): boolean => {
    const invalid = updatedPathData.filter((d) => !d.date || !d.money);
    if (invalid.length) {
      setInvalidEntries(invalid);
      return false;
    }
    setInvalidEntries([]);
    return true;
  };

  const validateAndGetOwnerId = async (): Promise<string> => {
    const { data: sessionData } = await dashboardService.getSession();
    const sessionUserId = sessionData?.session?.user?.id;

    if (!sessionUserId) {
      throw new Error("No authenticated user found");
    }

    const { data: userData } = await dashboardService.fetchUserData();
    if (!userData || userData.length === 0) {
      throw new Error("User profile not found");
    }

    const userProfile = userData[0];
    if (userProfile.id !== sessionUserId) {
      throw new Error("User ID mismatch - unauthorized access attempt");
    }

    return userProfile.book_id;
  };

  const handleSave = async () => {
    try {
      const updatedPathData = formatUpdatedPathData(pathData, editedValues);
      setPathData(updatedPathData);

      // Prevent saving if any entry is missing date or money
      if (!validateAllEntriesPresent(updatedPathData)) {
        return;
      }

      const ownerId = await validateAndGetOwnerId();
      const bookId = globalThis.crypto?.randomUUID
        ? globalThis.crypto.randomUUID()
        : String(Date.now());
      const title = computeTitleFromPathData(updatedPathData);

      await dashboardService.insertBookData(
        bookId,
        ownerId,
        title,
        updatedPathData,
      );
    } catch (error) {
      console.error("Error saving book data:", error);
      throw error;
    } finally {
      handleDialogClose();
    }
  };

  const onDateChange = (entryId: number, value: string) => {
    const newEdited = new Map(editedValues);
    newEdited.set(entryId, {
      date: value,
      money: newEdited.get(entryId)?.money || "",
    });
    setEditedValues(newEdited);
  };

  const onMoneyChange = (entryId: number, value: string) => {
    const newEdited = new Map(editedValues);
    newEdited.set(entryId, {
      date: newEdited.get(entryId)?.date || "",
      money: value,
    });
    setEditedValues(newEdited);
  };

  useEffect(() => {
    if (files?.length && files?.length !== 0) {
      getImageText();
    }
  }, [files]);

  const state: ItemCardModelState = {
    files,
    dialogState,
    pathData,
    sources,
    invalidEntries,
    carouselIndex,
    editedValues,
  };

  const actions: ItemCardModelActions = {
    setFiles,
    handleDialogClose,
    onFileChange,
    getImageText,
    handleSave,
    setCarouselIndex,
    onDateChange,
    onMoneyChange,
  };

  return [state, actions];
};

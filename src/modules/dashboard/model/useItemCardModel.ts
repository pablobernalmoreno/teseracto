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

interface ItemCardModelState {
  files: FileList | undefined;
  loader: boolean;
  successLoad: boolean;
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
  handleSave: () => void;
  setCarouselIndex: (index: number) => void;
  onDateChange: (entryId: number, value: string) => void;
  onMoneyChange: (entryId: number, value: string) => void;
}

export const useItemCardModel = (): [
  ItemCardModelState,
  ItemCardModelActions,
] => {
  const [files, setFiles] = useState<FileList>();
  const [loader, setLoader] = useState<boolean>(false);
  const [successLoad, setSuccessLoad] = useState<boolean>(false);
  const [pathData, setPathData] = useState<MainData[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [invalidEntries, setInvalidEntries] = useState<MainData[]>([]);
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [editedValues, setEditedValues] = useState<
    Map<number, { date: string; money: string }>
  >(new Map());

  const handleDialogClose = () => {
    setSuccessLoad(false);
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
      setLoader(true);
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
      }

      setPathData(result);
    }
    await worker.terminate();
    setLoader(false);
    setSuccessLoad(true);
  };

  const formatUpdatedPathData = (
    originalPathData: MainData[],
    edits: Map<number, { date: string; money: string }>,
  ): MainData[] => {
    const updated = [...originalPathData];
    edits.forEach((value, entryId) => {
      if (entryId !== undefined) {
        const formattedDate = value.date
          ? value.date.split("-").reverse().join("/")
          : updated[entryId].date;

        const formattedMoney = value.money
          ? parseFloat(value.money).toLocaleString("es-CO", {
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
    loader,
    successLoad,
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

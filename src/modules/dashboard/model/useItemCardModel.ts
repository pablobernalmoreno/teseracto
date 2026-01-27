import { useState, useEffect } from "react";
import { createWorker } from "tesseract.js";
import {
  combineDatesAndCurrency,
  extractCurrencyValues,
  findInvalidEntries,
  isCombinedDataValid,
  parseDates,
} from "@/app/utils/data";

interface MainData {
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
        setInvalidEntries(findInvalidEntries(result));
      }

      setPathData(result);
    }
    await worker.terminate();
    setLoader(false);
    setSuccessLoad(true);
  };

  const handleSave = () => {
    // Update pathData with edited values
    const updatedPathData = [...pathData];
    editedValues.forEach((value, entryId) => {
      if (entryId !== undefined) {
        // Format date from YYYY-MM-DD to DD/MM/YYYY
        const formattedDate = value.date
          ? value.date.split("-").reverse().join("/")
          : updatedPathData[entryId].date;

        // Format money to Colombian currency format
        const formattedMoney = value.money
          ? parseFloat(value.money).toLocaleString("es-CO", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })
          : updatedPathData[entryId].money;

        updatedPathData[entryId] = {
          ...updatedPathData[entryId],
          date: formattedDate,
          money: formattedMoney,
        };
      }
    });
    setPathData(updatedPathData);
    handleDialogClose();
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

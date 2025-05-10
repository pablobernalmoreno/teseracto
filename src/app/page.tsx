"use client";
import { ChangeEvent, useEffect, useState } from "react";
import { createWorker } from "tesseract.js";
import {
  combineDatesAndCurrency,
  extractCurrencyValues,
  findInvalidEntries,
  isCombinedDataValid,
  parseDates,
} from "./utils/data";

interface mainData {
  date: string;
  money: string;
  id: number;
}

export default function Home() {
  const [files, setFiles] = useState<FileList>();
  const [pathData, setPathData] = useState<mainData[]>([]);

  const handleChange = (event: ChangeEvent) => {
    const target = event.target as HTMLInputElement;
    const file = target.files as FileList;
    if (file) {
      setFiles(file);
    }
  };

  console.log({ pathData });

  const getImageText = async () => {
    const worker = await createWorker("eng");
    const paths = [];
    if (files?.length) {
      for (let i = 0; i < files?.length; ++i) {
        const file = files[i];
        const ret = await worker.recognize(file);
        const ocrText = ret.data.text;
        paths.push(ocrText);
      }
      const expectedDatesArray = parseDates(paths);
      const expectedCurrencyArray = extractCurrencyValues(paths);
      const result = combineDatesAndCurrency(
        expectedDatesArray,
        expectedCurrencyArray
      );

      if (!isCombinedDataValid(result)) {
        console.warn("Some entries are missing date or currency. Prompt user.");
        console.log(findInvalidEntries(result));
      } else {
        console.log("All good. Proceed with:", result);
      }

      setPathData(result);
    }
    await worker.terminate();
  };

  useEffect(() => {
    if (files?.length !== 0) {
      getImageText();
    }
  }, [files]);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        Teseracto
        <form>
          <h1>React File Upload</h1>
          <input type="file" multiple onChange={handleChange} />
          <button type="submit">Upload</button>
        </form>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        Pablo Bernal Moreno
      </footer>
    </div>
  );
}

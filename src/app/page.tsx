"use client";
import { ChangeEvent, useEffect, useState } from "react";
import { createWorker } from "tesseract.js";
import { parseDates } from "./utils/data";

const expectedArray = [
  {
    date: "13 abril 2025",
    money: "61.500,00",
    id: 0,
  },
  {
    date: "06/04/2025",
    money: "144.000,00",
    id: 1,
  },
  {
    date: "16 de abril de 2025",
    money: "117.000,00",
    id: 2,
  },
  {
    date: "16 de abril de 2025",
    money: "65.000,00",
    id: 3,
  },
  {
    date: "20 Abr 2025",
    money: "46.500",
    id: 4,
  },
  {
    date: "20 Abr 2025",
    money: "96.000",
    id: 5,
  },
  {
    date: "20 Abr 2025",
    money: "17.000",
    id: 6,
  },
  {
    date: "20 Abr 2025",
    money: "55.500",
    id: 7,
  },
  {
    date: "20 Abr 2025",
    money: "33.000",
    id: 8,
  },
];


export default function Home() {
  const [files, setFiles] = useState<FileList>();
  const [filePath, setFilePath] = useState(expectedArray);

  function handleChange(event: ChangeEvent) {
    const target = event.target as HTMLInputElement;
    const file = target.files as FileList;
    if (file) {
      setFiles(file);
    }
  }

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
      setFilePath([]);
      const expectedDatesArray = parseDates(paths);

      console.log({ paths, expectedDatesArray, filePath });
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

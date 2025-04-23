"use client";
import { ChangeEvent, useEffect, useState } from "react";
import { createWorker, ImageLike } from "tesseract.js";

export default function Home() {
  const [files, setFiles] = useState<FileList>();

  function handleChange(event: ChangeEvent) {
    const target = event.target as HTMLInputElement;
    const file = (target.files as FileList);
    if (file) {
      setFiles(file);
    }
  }

  const getImageText = async () => {
    const worker = await createWorker("eng");
    if (files?.length) {
      for (let i = 0; i < files?.length; ++i) {
        const file = files[i];
        const ret = await worker.recognize(file);
        const ocrText = ret.data.text;
        console.log(ocrText);
    }
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
          <input
            type="file"
            multiple
            onChange={handleChange}
          />
          <button type="submit">Upload</button>
        </form>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        Pablo Bernal Moreno
      </footer>
    </div>
  );
}

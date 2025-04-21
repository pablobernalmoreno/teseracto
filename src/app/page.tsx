"use client";
import { useEffect, useState } from "react";
import { createWorker } from "tesseract.js";

export default function Home() {
  const [file, setFile] = useState("");

  function handleChange(event: any) {
    setFile(event.target.files[0]);
  }

  const getImageText = async () => {
    const worker = await createWorker("eng");
    const ret = await worker.recognize(file);
    const ocrText = ret.data.text;
    console.log(ocrText);
    await worker.terminate();
  };

  useEffect(() => {
    if (file !== "") {
      getImageText();
    }
  }, [file]);
  // (async () => {
  //   const worker = await createWorker("eng");
  //   const ret = await worker.recognize(file);
  //   console.log({ret});

  //   console.log(ret.data.text);
  //   await worker.terminate();
  // })();

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        Teseracto
        <form>
          <h1>React File Upload</h1>
          <input type="file" onChange={handleChange} />
          <button type="submit">Upload</button>
        </form>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        Pablo Bernal Moreno
      </footer>
    </div>
  );
}

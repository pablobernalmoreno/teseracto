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
import { AppBarMenu } from "./components/appBarMenu/AppBarMenu";
import { Box, Button, Typography } from "@mui/material";
import "./page.css";

interface mainData {
  date: string;
  money: string;
  id: number;
}

export default function Home() {
  const [files, setFiles] = useState<FileList>();
  const [pathData, setPathData] = useState<mainData[]>([]);
  const [sources, setSources] = useState<string[]>([""]);

  const handleChange = (event: ChangeEvent) => {
    const target = event.target as HTMLInputElement;
    const file = target.files as FileList;
    if (file) {
      setFiles(file);
    }
  };

  const getImageText = async () => {
    const worker = await createWorker("eng");
    const paths = [];
    const sources = [""];
    if (files?.length) {
      for (let i = 0; i < files?.length; ++i) {
        const file = files[i];
        const ret = await worker.recognize(file);
        const ocrText = ret.data.text;
        sources.push(URL.createObjectURL(file));
        paths.push(ocrText);
      }
      sources.shift();
      setSources(sources);
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
    <>
      <AppBarMenu />
      <Box className="main_box">
        <section>
          <Typography className="title" variant="h3">
            Titulo!
          </Typography>
          <Typography variant="h6" className="description">
            Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui
            lorem cupidatat commodo. Elit sunt amet fugiat veniam occaecat.
          </Typography>
          <Box className="main_buttons_container">
            <Button
              className="get_started"
              variant="contained"
            >
              Empecemos
            </Button>
            <Button className="more_info">
              Más info
            </Button>
          </Box>
        </section>
      </Box>
    </>
  );
}

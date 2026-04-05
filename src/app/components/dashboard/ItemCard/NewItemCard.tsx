"use client";

import React from "react";
import { Card, CardActionArea, CardContent } from "@mui/material";
import "@/app/components/dashboard/dashboardStyles.css";
import { InputDialog, InputDialogProps } from "../Dialog/InputDialog";
import { CarouselValues } from "../InvalidEntryCarousel/InvalidEntryCarousel";

interface NewItemCardProps {
  onAddClick: () => void;
  dialogProps: Omit<InputDialogProps, "carouselValues" | "onDateChange" | "onMoneyChange"> & {
    carouselValues: CarouselValues;
    onDateChange: (entryId: number, value: string) => void;
    onMoneyChange: (entryId: number, value: string) => void;
  };
}

export const NewItemCard: React.FC<NewItemCardProps> = ({ onAddClick, dialogProps }) => {
  return (
    <>
      <Card
        className="dashboard-create-card-root"
        sx={{
          maxWidth: "100%",
          minHeight: 370,
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CardActionArea
          aria-label="Agregar un nuevo libro"
          onClick={onAddClick}
          sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <CardContent
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 1.2,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="50"
              height="50"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span
              style={{
                fontFamily: "var(--font-dashboard-display), serif",
                fontSize: "2rem",
                color: "#6f3417",
              }}
            >
              Nuevo volumen
            </span>
            <span style={{ color: "#6f5c4d", textAlign: "center", maxWidth: "18ch" }}>
              Incorpora otro libro al archivo y continúa catalogando.
            </span>
          </CardContent>
        </CardActionArea>
      </Card>
      <InputDialog {...dialogProps} />
    </>
  );
};

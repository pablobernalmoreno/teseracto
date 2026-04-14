"use client";

import React from "react";
import { Card, CardActionArea, CardContent } from "@mui/material";
import "@/app/components/dashboard/dashboardStyles.css";
import styles from "./NewItemCard.module.css";
import { InputDialog, InputDialogProps } from "../Dialog/InputDialog";
import { CarouselValues } from "../InvalidEntryCarousel/InvalidEntryCarousel";

interface NewItemCardProps {
  onAddClick: () => void;
  dialogProps: Omit<InputDialogProps, "carouselValues" | "onMoneyChange"> & {
    carouselValues: CarouselValues;
    onMoneyChange: (entryId: number, value: string) => void;
  };
}

export const NewItemCard: React.FC<NewItemCardProps> = ({ onAddClick, dialogProps }) => {
  return (
    <>
      <Card className={`dashboard-create-card-root ${styles.cardRoot}`}>
        <CardActionArea
          aria-label="Agregar un nuevo libro"
          onClick={onAddClick}
          className={styles.cardActionArea}
        >
          <CardContent className={styles.cardContent}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={styles.cardIcon}
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
            <span className={styles.cardTitle}>Nuevo volumen</span>
            <span className={styles.cardDescription}>
              Incorpora otro libro al archivo y continúa catalogando.
            </span>
          </CardContent>
        </CardActionArea>
      </Card>
      <InputDialog {...dialogProps} />
    </>
  );
};

import React from "react";
import { Card, CardActionArea, CardContent } from "@mui/material";
import "@/app/components/dashboard/dashboardStyles.css";
import { InputDialog, InputDialogProps } from "../InputDialog/InputDialog";
import { CarouselValues } from "../InvalidEntryCarousel/InvalidEntryCarousel";

interface NewItemCardProps {
  onAddClick: () => void;
  dialogProps: Omit<
    InputDialogProps,
    "carouselValues" | "onDateChange" | "onMoneyChange"
  > & {
    carouselValues: CarouselValues;
    onDateChange: (entryId: number, value: string) => void;
    onMoneyChange: (entryId: number, value: string) => void;
  };
}

export const NewItemCard: React.FC<NewItemCardProps> = ({
  onAddClick,
  dialogProps,
}) => {
  return (
    <>
      <Card
        sx={{
          margin: "1rem",
          borderRadius: "12px",
          width: 200,
          height: 200,
          display: "flex",
          alignItems: "center",
        }}
      >
        <CardActionArea onClick={onAddClick}>
          <CardContent
            sx={{
              display: "flex",
              justifyContent: "center",
              height: "100%",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="50"
              height="50"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </CardContent>
        </CardActionArea>
      </Card>
      <InputDialog {...dialogProps} />
    </>
  );
};

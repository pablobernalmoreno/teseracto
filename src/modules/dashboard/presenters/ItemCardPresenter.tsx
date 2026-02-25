"use client";
import React, { useRef, useState } from "react";
import { useItemCardModel } from "../model/useItemCardModel";
import { NormalItemCard } from "@/app/components/dashboard/ItemCard/NormalItemCard";
import { NewItemCard } from "@/app/components/dashboard/ItemCard/NewItemCard";

interface ItemCardPresenterProps {
  cardId: string | number;
  name: string;
  description: string;
}

export const ItemCardPresenter: React.FC<ItemCardPresenterProps> = ({
  cardId,
  name,
  description,
}) => {

  const [state, actions] = useItemCardModel();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleInputDialogOpen = () => {
    setOpen(true);
  };

  const handleInputDialogClose = () => {
    setOpen(false);
    actions.handleDialogClose();
  };

  const onContentClick = () => {
    inputRef.current?.click();
  };

  if (name?.includes("newItemCard")) {
    // Convert Map to object for carouselValues prop
    const carouselValues: {
      [entryId: number]: { date: string; money: string };
    } = {};
    state.editedValues.forEach((value, entryId) => {
      carouselValues[entryId] = value;
    });

    const dialogProps = {
      open,
      loader: state.loader,
      successLoad: state.successLoad,
      invalidEntries: state.invalidEntries,
      sources: state.sources,
      carouselIndex: state.carouselIndex,
      carouselValues,
      onClose: handleInputDialogClose,
      onSave: () => {
        actions.handleSave();
        handleInputDialogClose();
      },
      onFileChange: actions.onFileChange,
      onPrev: () =>
        actions.setCarouselIndex(Math.max(0, state.carouselIndex - 1)),
      onNext: () =>
        actions.setCarouselIndex(
          Math.min(state.invalidEntries.length - 1, state.carouselIndex + 1),
        ),
      onDateChange: actions.onDateChange,
      onMoneyChange: actions.onMoneyChange,
      inputRef,
      onContentClick,
    };

    return (
      <NewItemCard
        onAddClick={handleInputDialogOpen}
        dialogProps={dialogProps}
      />
    );
  }

  return (
    <NormalItemCard cardId={cardId} name={name} description={description} />
  );
};

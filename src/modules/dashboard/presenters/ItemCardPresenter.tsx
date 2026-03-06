"use client";
import React, { useRef, useState } from "react";
import { useItemCardModel, MainData } from "../model/useItemCardModel";
import { NormalItemCard } from "@/app/components/dashboard/ItemCard/NormalItemCard";
import { NewItemCard } from "@/app/components/dashboard/ItemCard/NewItemCard";

interface ItemCardPresenterProps {
  cardId: string | number;
  name: string;
  description: string;
  content?: MainData[];
  onOpenDetail?: (id: string | number) => void;
  onBookCreated?: () => Promise<void> | void;
}

export const ItemCardPresenter: React.FC<ItemCardPresenterProps> = ({
  cardId,
  name,
  description,
  content,
  onOpenDetail,
  onBookCreated,
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
      dialogState: state.dialogState,
      invalidEntries: state.invalidEntries,
      sources: state.sources,
      carouselIndex: state.carouselIndex,
      carouselValues,
      onClose: handleInputDialogClose,
      onSave: async () => {
        try {
          await actions.handleSave();
          await onBookCreated?.();
        } finally {
          setOpen(false);
        }
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
    <NormalItemCard
      cardId={cardId}
      name={name}
      description={description}
      content={content}
      onOpenDetail={onOpenDetail}
    />
  );
};

"use client";
import React, { useRef, useState } from "react";
import { useItemCardModel } from "../model/useItemCardModel";
import type { BookData } from "@/app/actions/dashboard";
import { ViewItemCard } from "@/app/components/dashboard/ItemCard/ViewItemCard";
import { NewItemCard } from "@/app/components/dashboard/ItemCard/NewItemCard";
import type { MainData } from "@/types/dashboard";

interface ItemCardPresenterProps {
  cardId: string | number;
  name: string;
  content?: MainData[];
  onOpenDetail?: (id: string | number) => void;
  onBeforeAddClick?: () => void;
  onBookCreated?: (newBook?: BookData | null) => Promise<void> | void;
  isSelected?: boolean;
  onSelectionChange?: (cardId: string | number, checked: boolean) => void;
}

const ItemCardPresenterComponent: React.FC<ItemCardPresenterProps> = ({
  cardId,
  name,
  content,
  onOpenDetail,
  onBeforeAddClick,
  onBookCreated,
  isSelected = false,
  onSelectionChange,
}) => {
  const [state, actions] = useItemCardModel();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleInputDialogOpen = () => {
    onBeforeAddClick?.();
    setOpen(true);
  };

  const handleInputDialogClose = () => {
    setOpen(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    actions.handleDialogClose();
  };

  const isCreateVariant = cardId === "new-item";

  if (isCreateVariant) {
    const carouselValues: {
      [entryId: number]: { money: string };
    } = {};
    state.editedValues.forEach((value, entryId) => {
      carouselValues[entryId] = value;
    });

    const entryMessages: Record<number, string> = {};
    state.entryMessages.forEach((message, entryId) => {
      entryMessages[entryId] = message;
    });

    const dialogProps = {
      open,
      dialogState: state.dialogState,
      invalidEntries: state.invalidEntries,
      sources: state.sources,
      carouselIndex: state.carouselIndex,
      carouselValues,
      selectedDate: state.selectedDate,
      excludedEntryIds: Array.from(state.excludedEntryIds),
      entryMessages,
      onClose: handleInputDialogClose,
      onSave: async () => {
        try {
          const newBook = await actions.handleSave();
          // Call onBookCreated with the newly created book for optimistic update
          if (onBookCreated) {
            await onBookCreated(newBook);
          }
        } finally {
          setOpen(false);
        }
      },
      onFileChange: actions.onFileChange,
      onPrev: () => actions.setCarouselIndex(Math.max(0, state.carouselIndex - 1)),
      onNext: () =>
        actions.setCarouselIndex(
          Math.min(state.invalidEntries.length - 1, state.carouselIndex + 1)
        ),
      onMoneyChange: actions.onMoneyChange,
      inputRef,
    };

    return <NewItemCard onAddClick={handleInputDialogOpen} dialogProps={dialogProps} />;
  }

  return (
    <ViewItemCard
      cardId={cardId}
      name={name}
      content={content}
      onOpenDetail={onOpenDetail}
      isSelected={isSelected}
      onSelectionChange={(checked) => onSelectionChange?.(cardId, checked)}
    />
  );
};

export const ItemCardPresenter = React.memo(ItemCardPresenterComponent);

export default ItemCardPresenter;

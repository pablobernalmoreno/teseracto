"use client";
import React, { useRef, useState } from "react";
import { useItemCardModel } from "../model/useItemCardModel";
import type { BookData } from "@/app/actions/dashboard";
import { ViewItemCard } from "@/features/dashboard/components/ItemCard/ViewItemCard";
import { NewItemCard } from "@/features/dashboard/components/ItemCard/NewItemCard";
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
    const dialogProps = {
      open,
      dialogState: state.dialogState,
      attentionEntries: state.attentionEntries,
      entryIssues: Object.fromEntries(state.entryIssues),
      sources: state.sources,
      rangeTitle: state.rangeTitle,
      canSave: state.canSave,
      activeEntryId: state.activeEntryId,
      onClose: handleInputDialogClose,
      saveError: state.saveError,
      onSave: async () => {
        let newBook: BookData | null;
        try {
          newBook = await actions.handleSave();
        } catch {
          // Fails closed: nothing was saved, so the dialog stays open on the review. The model has
          // already logged the error and exposes it as `saveError` for the dialog to show.
          return;
        }

        // Close promptly to avoid a visible gap while list refresh completes.
        setOpen(false);

        // Keep save flow pending until the parent post-save workflow finishes.
        if (onBookCreated) {
          await onBookCreated(newBook);
        }
      },
      onFileChange: actions.onFileChange,
      onActiveEntryChange: actions.setActiveEntryId,
      onDateChange: actions.onDateChange,
      onMoneyChange: actions.onMoneyChange,
      onConfirmDate: actions.onConfirmDate,
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

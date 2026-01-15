"use client";
import React, { useRef, useState } from "react";
import { useItemCardModel } from "../model/useItemCardModel";
import {
  NewItemCardView,
  NormalItemCardView,
} from "../views/DashboardViews";

interface ItemCardPresenterProps {
  name: string;
  description: string;
}

export const ItemCardPresenter: React.FC<ItemCardPresenterProps> = ({
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

  if (name.includes("newItemCard")) {
    const dialogProps = {
      open,
      loader: state.loader,
      successLoad: state.successLoad,
      invalidEntries: state.invalidEntries,
      sources: state.sources,
      carouselIndex: state.carouselIndex,
      onClose: handleInputDialogClose,
      onSave: () => {
        actions.handleSave();
        handleInputDialogClose();
      },
      onFileChange: actions.onFileChange,
      onPrev: () =>
        actions.setCarouselIndex(
          Math.max(0, state.carouselIndex - 1)
        ),
      onNext: () =>
        actions.setCarouselIndex(
          Math.min(state.invalidEntries.length - 1, state.carouselIndex + 1)
        ),
      onDateChange: actions.onDateChange,
      onMoneyChange: actions.onMoneyChange,
      inputRef,
      onContentClick,
    };

    return (
      <NewItemCardView
        onAddClick={handleInputDialogOpen}
        dialogProps={dialogProps}
      />
    );
  }

  return <NormalItemCardView name={name} description={description} />;
};

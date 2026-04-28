"use client";

import { useState } from "react";
import type { MainData } from "@/types/dashboard";

export const useDashboardUiState = () => {
  const [selectedCardId, setSelectedCardId] = useState<string | number | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<Array<string | number>>([]);
  const [editedRows, setEditedRows] = useState<MainData[]>([]);

  const selectedDeleteCount = selectedCardIds.length;

  const setActiveCard = (cardId: string | number | null) => {
    setSelectedCardId(cardId);
  };

  const selectCard = (cardId: string | number) => {
    setSelectedCardIds((prev) => (prev.includes(cardId) ? prev : [...prev, cardId]));
  };

  const deselectCard = (cardId: string | number) => {
    setSelectedCardIds((prev) => prev.filter((id) => id !== cardId));
  };

  const clearCardSelection = () => {
    setSelectedCardIds([]);
  };

  const clearDetail = () => {
    setSelectedCardId(null);
    setEditedRows([]);
  };

  return {
    selectedCardId,
    selectedCardIds,
    selectedDeleteCount,
    editedRows,
    setEditedRows,
    setActiveCard,
    selectCard,
    deselectCard,
    clearCardSelection,
    clearDetail,
  };
};

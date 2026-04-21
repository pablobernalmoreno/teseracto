"use client";

import React, { useCallback } from "react";
import { Box } from "@mui/material";
import { ItemCardPresenter } from "@/features/dashboard/presenters/ItemCardPresenter";
import type { BookData } from "@/app/actions/dashboard";

interface DashboardCardsGridProps {
  items: BookData[];
  selectedCardIds: Array<string | number>;
  onOpenDetail: (id: string | number) => Promise<void>;
  onBeforeAddClick: () => void;
  onBookCreated: () => Promise<void> | void;
  onSelectCard: (cardId: string | number) => void;
  onDeselectCard: (cardId: string | number) => void;
}

export const DashboardCardsGrid: React.FC<DashboardCardsGridProps> = React.memo(
  ({
    items,
    selectedCardIds,
    onOpenDetail,
    onBeforeAddClick,
    onBookCreated,
    onSelectCard,
    onDeselectCard,
  }) => {
    const handleSelectionChange = useCallback(
      (cardId: string | number, checked: boolean) => {
        if (checked) {
          onSelectCard(cardId);
        } else {
          onDeselectCard(cardId);
        }
      },
      [onSelectCard, onDeselectCard]
    );

    return (
      <Box className="dashboard_cards_grid">
        {items.map((item) => {
          const isCreateCard = item.id === "new-item";

          return (
            <Box
              key={item.id}
              className={
                isCreateCard
                  ? "dashboard_cards_slot dashboard_cards_slot--create"
                  : "dashboard_cards_slot"
              }
            >
              <ItemCardPresenter
                cardId={item.id}
                name={item.title}
                content={item.content}
                onOpenDetail={onOpenDetail}
                onBeforeAddClick={onBeforeAddClick}
                onBookCreated={onBookCreated}
                isSelected={selectedCardIds.includes(item.id)}
                onSelectionChange={handleSelectionChange}
              />
            </Box>
          );
        })}
      </Box>
    );
  }
);

DashboardCardsGrid.displayName = "DashboardCardsGrid";

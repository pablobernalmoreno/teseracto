"use client";

import React, { useEffect, useState } from "react";
import { DashboardSummaryStats } from "./DashboardSummaryStats";
import { DashboardDetailPanel } from "./DashboardDetailPanel";
import { DashboardCardsGrid } from "./DashboardCardsGrid";
import { DashboardHistoryView } from "./DashboardHistoryView";
import { Box, CircularProgress, Pagination, Paper, Typography } from "@mui/material";
import { useMainDashboardState } from "@/features/dashboard/model/state/useMainDashboardState";
import "./mainStyles.css";
import { SearchNavbar } from "@/app/components/dashboard/SearchNavbar/SearchNavbar";
import AlertMessage from "@/app/components/dashboard/Dialog/AlertMessage";
import DeleteDialog from "@/app/components/dashboard/Dialog/DeleteDialog";
import UnsavedChangesDialog from "@/app/components/dashboard/Dialog/UnsavedChangesDialog";
import { fetchAllBooksHistory, type BookData } from "@/app/actions/dashboard";

interface MainPageContentProps {
  initialBooks: BookData[];
  initialBooksCount: number;
  showHistory?: boolean;
  onHideHistory?: () => void;
}

export const MainPageContent: React.FC<MainPageContentProps> = ({
  initialBooks,
  initialBooksCount,
  showHistory = false,
  onHideHistory,
}) => {
  const [historyBooks, setHistoryBooks] = useState<BookData[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const { state, actions } = useMainDashboardState({
    initialBooks,
    initialBooksCount,
  });

  const {
    isPending,
    currentPage,
    searchQuery,
    selectedCardId,
    selectedCardIds,
    isDeleteModalOpen,
    toastOpen,
    toastMessage,
    toastSeverity,
    editedRows,
    totalPages,
    filteredCount,
    allItems,
    selectedDeleteCount,
    selectedCardTitle,
    activeItem,
    activeCardDate,
    activeCardTitle,
    libraryCount,
    isUnsavedDialogOpen,
    hasUnsavedChanges,
  } = state;

  useEffect(() => {
    if (!showHistory) {
      return;
    }

    let isCancelled = false;

    const loadHistoryBooks = async () => {
      setIsHistoryLoading(true);
      setHistoryError(null);

      const result = await fetchAllBooksHistory();
      if (isCancelled) {
        return;
      }

      if (result.error || !result.data) {
        setHistoryBooks([]);
        setHistoryError(result.error ?? "No se pudo cargar el historial.");
      } else {
        setHistoryBooks(result.data);
        setHistoryError(null);
      }

      setIsHistoryLoading(false);
    };

    void loadHistoryBooks();

    return () => {
      isCancelled = true;
    };
  }, [showHistory]);

  const dashboardContent = selectedCardId ? (
    <DashboardDetailPanel
      bookId={selectedCardId}
      title={activeCardTitle || activeItem?.title || "Detalle del libro"}
      bookDate={activeCardDate}
      hasUnsavedChanges={hasUnsavedChanges}
      editedRows={editedRows}
      isPending={isPending}
      onBack={actions.handleBackFromDetail}
      onSave={actions.handleSaveDetail}
      onSaveAndExit={actions.handleSaveAndExitDetail}
      onBookDateChange={actions.handleDetailDateChange}
      onRowsChange={actions.setEditedRows}
    />
  ) : (
    <DashboardCardsGrid
      items={allItems}
      selectedCardIds={selectedCardIds}
      onOpenDetail={actions.openDetail}
      onBeforeAddClick={actions.clearCardSelection}
      onBookCreated={actions.handleBookCreated}
      onSelectCard={actions.selectCard}
      onDeselectCard={actions.deselectCard}
    />
  );

  return (
    <>
      <main id="main-content" className="dashboard_shell">
        <Box className="dashboard_hero">
          <Box className="dashboard_hero_copy">
            <Typography className="dashboard_hero_eyebrow" component="p">
              Archivo vivo de tu biblioteca
            </Typography>
            <Typography className="dashboard_hero_title" component="h1" variant="h2">
              Un tablero con pulso editorial para revisar, ordenar y corregir cada libro.
            </Typography>
            <Typography className="dashboard_hero_body" variant="body1">
              La colección se presenta como una mesa de trabajo cálida, con foco en lectura rápida,
              selección masiva y edición sin ruido visual.
            </Typography>
          </Box>

          <DashboardSummaryStats
            libraryCount={libraryCount}
            selectedCardId={selectedCardId}
            editedRowsLength={editedRows.length}
            filteredCount={filteredCount}
            selectedDeleteCount={selectedDeleteCount}
            totalPages={totalPages}
          />
        </Box>

        <Box className="dashboard_stage">
          {showHistory ? (
            <DashboardHistoryView
              books={historyBooks}
              isLoading={isHistoryLoading}
              loadError={historyError}
              onBack={onHideHistory ?? (() => {})}
            />
          ) : (
            <>
              {!selectedCardId && (
                <Box className="dashboard_top">
                  <SearchNavbar
                    value={searchQuery}
                    onChange={actions.handleSearchChange}
                    matchCount={filteredCount}
                    selectedCount={selectedCardIds.length}
                    onDeleteClick={actions.openDeleteModal}
                  />
                </Box>
              )}

              <Box className="dashboard_middle">
                {isPending ? (
                  <Paper elevation={0} className="dashboard_loading_panel">
                    <CircularProgress size={88} />
                    <Typography className="dashboard_loading_text" variant="body1">
                      Preparando el archivo y ordenando tus registros.
                    </Typography>
                  </Paper>
                ) : (
                  dashboardContent
                )}
              </Box>

              {!selectedCardId && (
                <Box className="dashboard_pagination">
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={actions.handlePageChange}
                    color="primary"
                    size="large"
                    disabled={isPending}
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </main>

      <DeleteDialog
        open={isDeleteModalOpen}
        selectedDeleteCount={selectedDeleteCount}
        selectedCardTitle={selectedCardTitle}
        onClose={actions.closeDeleteModal}
        onDelete={actions.deleteSelectedCards}
      />

      <AlertMessage
        open={toastOpen}
        message={toastMessage}
        severity={toastSeverity}
        onClose={actions.closeToast}
      />

      <UnsavedChangesDialog
        open={isUnsavedDialogOpen}
        hasUnsavedChanges={hasUnsavedChanges}
        onClose={actions.closeUnsavedChangesDialog}
        onSave={actions.saveAndContinueWithUnsavedChanges}
        onDiscard={actions.discardAndContinueWithUnsavedChanges}
      />
    </>
  );
};

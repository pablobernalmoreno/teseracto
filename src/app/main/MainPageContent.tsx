"use client";

import React from "react";
import { DashboardSummaryStats } from "./DashboardSummaryStats";
import { DashboardDetailPanel } from "./DashboardDetailPanel";
import { DashboardCardsGrid } from "./DashboardCardsGrid";
import { Box, CircularProgress, Pagination, Paper, Typography } from "@mui/material";
import { useMainDashboardState } from "./useMainDashboardState";
import "./mainStyles.css";
import { SearchNavbar } from "../components/dashboard/SearchNavbar/SearchNavbar";
import AlertMessage from "../components/dashboard/Dialog/AlertMessage";
import DeleteDialog from "../components/dashboard/Dialog/DeleteDialog";
import { Cormorant_Garamond, Work_Sans } from "next/font/google";
import { type BookData } from "@/app/actions/dashboard";

const dashboardDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-dashboard-display",
  weight: ["500", "600", "700"],
});

const dashboardSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-dashboard-sans",
  weight: ["400", "500", "600", "700"],
});

interface MainPageContentProps {
  initialBooks: BookData[];
  initialBooksCount: number;
}

export const MainPageContent: React.FC<MainPageContentProps> = ({
  initialBooks,
  initialBooksCount,
}) => {
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
    libraryCount,
  } = state;

  const dashboardContent = selectedCardId ? (
    <DashboardDetailPanel
      title={activeItem?.title || "Detalle del libro"}
      editedRows={editedRows}
      isPending={isPending}
      onBack={actions.handleBackFromDetail}
      onSave={actions.handleSaveDetail}
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
      <main
        id="main-content"
        className={`dashboard_shell ${dashboardDisplay.variable} ${dashboardSans.variable}`}
      >
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
    </>
  );
};

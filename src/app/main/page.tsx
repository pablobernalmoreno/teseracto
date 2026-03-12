"use client";
import React from "react";
import { AppBarMenu } from "../components/appBarMenu/AppBarMenu";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
  Pagination,
} from "@mui/material";
import { useDashboardPageModel } from "@/modules/dashboard/model/useDashboardPageModel";
import dynamic from "next/dynamic";
import "./mainStyles.css";
import DataTable from "../components/dataTable/DataTable";
import { SearchNavbar } from "../components/dashboard/SearchNavbar/SearchNavbar";
import AlertMessage from "../components/dashboard/Dialog/AlertMessage";
import DeleteDialog from "../components/dashboard/Dialog/DeleteDialog";

const ItemCardPresenter = dynamic(() =>
  import("@/modules/dashboard/presenters/ItemCardPresenter").then((mod) => ({
    default: mod.ItemCardPresenter,
  })),
);

const Page = () => {
  const [state, actions] = useDashboardPageModel();
  const {
    items,
    isLoading,
    selectedCardId,
    editedRows,
    currentItems,
    totalPages,
    currentPage,
    searchQuery,
    filteredCount,
    selectedCardIds,
    isDeleteModalOpen,
    toastOpen,
    toastMessage,
    toastSeverity,
  } = state;

  const selectedDeleteCount = selectedCardIds.length;
  const selectedCardTitle =
    selectedDeleteCount === 1
      ? items.find((item) => item.id === selectedCardIds[0])?.title || ""
      : "";

  return (
    <>
      <AppBarMenu isLogged />
      <Paper elevation={3} className="dashboard_header">
        <Typography variant="h4">Dashboard</Typography>
      </Paper>
      <Box className="dashboard_background">
        <Box className="dashboard_container">
          {!selectedCardId && (
            <Box className="dashboard_top">
              <SearchNavbar
                value={searchQuery}
                onChange={actions.setSearchQuery}
                matchCount={filteredCount}
                selectedCount={selectedCardIds.length}
                onDeleteClick={actions.openDeleteModal}
              />
            </Box>
          )}

          <Box className="dashboard_middle">
            {isLoading ? (
              <Box className="dashboard_loading">
                <CircularProgress size={150} />
              </Box>
            ) : selectedCardId ? (
              <Paper elevation={2} sx={{ width: "100%", padding: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Detalle del libro</Typography>
                  <Box>
                    <Button onClick={actions.handleBackFromDetail} sx={{ mr: 1 }}>
                      Volver
                    </Button>
                    <Button variant="contained" onClick={actions.handleSaveDetail}>
                      Guardar
                    </Button>
                  </Box>
                </Box>
                <DataTable
                  rows={editedRows}
                  editable
                  onRowsChange={actions.setEditedRows}
                />
              </Paper>
            ) : (
              <Box className="dashboard_cards_grid">
                {currentItems.map((item) => (
                  <ItemCardPresenter
                    key={item.id}
                    cardId={item.id}
                    name={item.title}
                    description={item.description}
                    content={item.content}
                    onOpenDetail={actions.openDetail}
                    onBeforeAddClick={actions.clearCardSelection}
                    onBookCreated={actions.handleBookCreated}
                    isSelected={selectedCardIds.includes(item.id)}
                    onSelectionChange={actions.toggleCardSelection}
                  />
                ))}
              </Box>
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
                disabled={isLoading}
              />
            </Box>
          )}
        </Box>
      </Box>

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

export default Page;

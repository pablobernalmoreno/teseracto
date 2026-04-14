"use client";

import { deleteBooks as deleteBooksFn, type BookData } from "@/app/actions/dashboard";
import type { MainData } from "@/types/dashboard";
import { useDashboardBooksData } from "./useDashboardBooksData";
import { useDashboardUiState } from "./useDashboardUiState";
import { useDashboardModals } from "./DashboardModalContext";

interface UseMainDashboardStateParams {
  initialBooks: BookData[];
  initialBooksCount: number;
}

interface DashboardState {
  isPending: boolean;
  currentPage: number;
  searchQuery: string;
  selectedCardId: string | number | null;
  selectedCardIds: Array<string | number>;
  isDeleteModalOpen: boolean;
  toastOpen: boolean;
  toastMessage: string;
  toastSeverity: "success" | "error";
  editedRows: MainData[];
  totalPages: number;
  filteredCount: number;
  allItems: BookData[];
  currentItems: BookData[];
  selectedDeleteCount: number;
  selectedCardTitle: string;
  activeItem: BookData | null;
  libraryCount: number;
}

interface DashboardActions {
  handlePageChange: (_: unknown, page: number) => void;
  handleSearchChange: (query: string) => void;
  openDetail: (bookId: string | number) => Promise<void>;
  handleBackFromDetail: () => void;
  handleSaveDetail: () => void;
  openDeleteModal: () => void;
  closeDeleteModal: () => void;
  deleteSelectedCards: () => void;
  selectCard: (cardId: string | number) => void;
  deselectCard: (cardId: string | number) => void;
  clearCardSelection: () => void;
  handleBookCreated: () => void;
  closeToast: () => void;
  setEditedRows: React.Dispatch<React.SetStateAction<MainData[]>>;
}

interface UseMainDashboardStateResult {
  state: DashboardState;
  actions: DashboardActions;
}

export const useMainDashboardState = ({
  initialBooks,
  initialBooksCount,
}: UseMainDashboardStateParams): UseMainDashboardStateResult => {
  const booksData = useDashboardBooksData({ initialBooks, initialBooksCount });
  const uiState = useDashboardUiState();
  const modals = useDashboardModals();

  const currentItems = booksData.books;
  const selectedDeleteCount = uiState.selectedDeleteCount;
  const selectedCardTitle =
    selectedDeleteCount === 1
      ? currentItems.find((item) => item.id === uiState.selectedCardIds[0])?.title || ""
      : "";
  const activeItem = uiState.selectedCardId
    ? (currentItems.find((item) => item.id === uiState.selectedCardId) ?? null)
    : null;

  const openDetail = async (bookId: string | number) => {
    // Fetch data before updating UI to avoid waterfall
    const rows = await booksData.fetchDetailRows(bookId);
    // Set both states together (they're independent)
    uiState.setActiveCard(bookId);
    uiState.setEditedRows(rows);
  };

  const handleSaveDetail = () => {
    if (!uiState.selectedCardId) return;
    const bookId = uiState.selectedCardId;

    void (async () => {
      const result = await booksData.saveDetailRows(bookId, uiState.editedRows);
      if (result.error) {
        modals.showToast("Error al guardar", "error");
        return;
      }

      modals.showToast("Guardado correctamente", "success");
      uiState.clearDetail();
    })();
  };

  const deleteSelectedCards = () => {
    modals.closeDeleteModal();

    void (async () => {
      const result = await deleteBooksFn(uiState.selectedCardIds);
      if (result.error) {
        modals.showToast(result.error, "error");
      } else {
        uiState.clearCardSelection();
        modals.showToast("Elementos eliminados correctamente", "success");
        booksData.refreshCurrentPage();
      }
    })();
  };

  const handleBookCreated = (newBook?: BookData | null) => {
    if (newBook) {
      // Optimistically add the new book to the list
      booksData.addNewBook(newBook);
    }
    booksData.refreshFirstPage();
  };

  return {
    state: {
      isPending: booksData.isPending,
      currentPage: booksData.currentPage,
      searchQuery: booksData.searchQuery,
      selectedCardId: uiState.selectedCardId,
      selectedCardIds: uiState.selectedCardIds,
      isDeleteModalOpen: modals.isDeleteModalOpen,
      toastOpen: modals.toastOpen,
      toastMessage: modals.toastMessage,
      toastSeverity: modals.toastSeverity,
      editedRows: uiState.editedRows,
      totalPages: booksData.totalPages,
      filteredCount: booksData.filteredCount,
      allItems: booksData.allItems,
      currentItems,
      selectedDeleteCount,
      selectedCardTitle,
      activeItem,
      libraryCount: booksData.libraryCount,
    },
    actions: {
      handlePageChange: booksData.handlePageChange,
      handleSearchChange: booksData.handleSearchChange,
      openDetail,
      handleBackFromDetail: uiState.clearDetail,
      handleSaveDetail,
      openDeleteModal: modals.openDeleteModal,
      closeDeleteModal: modals.closeDeleteModal,
      deleteSelectedCards,
      selectCard: uiState.selectCard,
      deselectCard: uiState.deselectCard,
      clearCardSelection: uiState.clearCardSelection,
      handleBookCreated,
      closeToast: modals.closeToast,
      setEditedRows: uiState.setEditedRows,
    },
  };
};

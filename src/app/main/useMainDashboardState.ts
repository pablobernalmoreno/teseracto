"use client";

import { useEffect, useMemo, useState } from "react";
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
  isUnsavedDialogOpen: boolean;
  hasUnsavedChanges: boolean;
}

interface DashboardActions {
  handlePageChange: (_: unknown, page: number) => void;
  handleSearchChange: (query: string) => void;
  openDetail: (bookId: string | number) => Promise<void>;
  handleBackFromDetail: () => void;
  handleSaveDetail: () => void;
  handleSaveAndExitDetail: () => void;
  openDeleteModal: () => void;
  closeDeleteModal: () => void;
  deleteSelectedCards: () => void;
  selectCard: (cardId: string | number) => void;
  deselectCard: (cardId: string | number) => void;
  clearCardSelection: () => void;
  handleBookCreated: (newBook?: BookData | null) => void;
  closeToast: () => void;
  setEditedRows: React.Dispatch<React.SetStateAction<MainData[]>>;
  saveAndContinueWithUnsavedChanges: () => void;
  discardAndContinueWithUnsavedChanges: () => void;
  closeUnsavedChangesDialog: () => void;
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
  const [initialDetailRows, setInitialDetailRows] = useState<MainData[]>([]);
  const [pendingNavigationAction, setPendingNavigationAction] = useState<(() => void) | null>(null);

  const currentItems = booksData.books;
  const selectedDeleteCount = uiState.selectedDeleteCount;
  const selectedCardTitle =
    selectedDeleteCount === 1
      ? currentItems.find((item) => item.id === uiState.selectedCardIds[0])?.title || ""
      : "";
  const activeItem = uiState.selectedCardId
    ? (currentItems.find((item) => item.id === uiState.selectedCardId) ?? null)
    : null;

  const normalizeRows = (rows: MainData[]) =>
    rows.map((row) => ({
      id: row.id,
      date: row.date ?? "",
      money: row.money ?? "",
    }));

  const hasUnsavedChanges = useMemo(() => {
    if (!uiState.selectedCardId) {
      return false;
    }

    return (
      JSON.stringify(normalizeRows(uiState.editedRows)) !==
      JSON.stringify(normalizeRows(initialDetailRows))
    );
  }, [uiState.selectedCardId, uiState.editedRows, initialDetailRows]);

  const isUnsavedDialogOpen = pendingNavigationAction !== null;

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const normalizeCardDate = (creationTime?: string): string => {
    if (!creationTime) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(creationTime)) return creationTime;

    const parsed = new Date(creationTime);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const openDetailInternal = async (bookId: string | number) => {
    const selectedBook = currentItems.find((item) => item.id === bookId);
    const cardDate = normalizeCardDate(selectedBook?.creationTime);
    // Fetch data before updating UI to avoid waterfall
    const rows = await booksData.fetchDetailRows(bookId, cardDate);
    // Set both states together (they're independent)
    uiState.setActiveCard(bookId);
    uiState.setEditedRows(rows);
    setInitialDetailRows(rows);
  };

  const openDetail = async (bookId: string | number) => {
    if (hasUnsavedChanges && uiState.selectedCardId && uiState.selectedCardId !== bookId) {
      setPendingNavigationAction(() => {
        return () => {
          void openDetailInternal(bookId);
        };
      });
      return;
    }

    await openDetailInternal(bookId);
  };

  const saveDetailInternal = async (exitAfterSave: boolean): Promise<boolean> => {
    if (!uiState.selectedCardId) return false;
    const bookId = uiState.selectedCardId;
    const selectedBook = currentItems.find((item) => item.id === bookId);
    const cardDate = normalizeCardDate(selectedBook?.creationTime);
    const rowsToSave = cardDate
      ? uiState.editedRows.map((row) => ({ ...row, date: cardDate }))
      : uiState.editedRows;

    const result = await booksData.saveDetailRows(bookId, rowsToSave);
    if (result.error) {
      modals.showToast("Error al guardar", "error");
      return false;
    }

    modals.showToast("Guardado correctamente", "success");

    if (exitAfterSave) {
      uiState.clearDetail();
      setInitialDetailRows([]);
      return true;
    }

    uiState.setEditedRows(rowsToSave);
    setInitialDetailRows(rowsToSave);
    return true;
  };

  const handleSaveDetail = () => {
    void saveDetailInternal(false);
  };

  const handleSaveAndExitDetail = () => {
    void saveDetailInternal(true);
  };

  const handleBackFromDetail = () => {
    if (hasUnsavedChanges) {
      setPendingNavigationAction(() => {
        return () => {
          uiState.clearDetail();
          setInitialDetailRows([]);
        };
      });
      return;
    }

    uiState.clearDetail();
    setInitialDetailRows([]);
  };

  const closeUnsavedChangesDialog = () => {
    setPendingNavigationAction(null);
  };

  const discardAndContinueWithUnsavedChanges = () => {
    const pendingAction = pendingNavigationAction;
    setPendingNavigationAction(null);
    uiState.clearDetail();
    setInitialDetailRows([]);
    pendingAction?.();
  };

  const saveAndContinueWithUnsavedChanges = () => {
    const pendingAction = pendingNavigationAction;
    setPendingNavigationAction(null);

    void (async () => {
      const saved = await saveDetailInternal(false);
      if (saved) {
        pendingAction?.();
      }
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
        void booksData.refreshCurrentPage();
      }
    })();
  };

  const handleBookCreated = (newBook?: BookData | null) => {
    if (newBook) {
      // Optimistically add the new book to the list
      booksData.addNewBook(newBook);
    }
    void booksData.refreshFirstPage();
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
      isUnsavedDialogOpen,
      hasUnsavedChanges,
    },
    actions: {
      handlePageChange: booksData.handlePageChange,
      handleSearchChange: booksData.handleSearchChange,
      openDetail,
      handleBackFromDetail,
      handleSaveDetail,
      handleSaveAndExitDetail,
      openDeleteModal: modals.openDeleteModal,
      closeDeleteModal: modals.closeDeleteModal,
      deleteSelectedCards,
      selectCard: uiState.selectCard,
      deselectCard: uiState.deselectCard,
      clearCardSelection: uiState.clearCardSelection,
      handleBookCreated,
      closeToast: modals.closeToast,
      setEditedRows: uiState.setEditedRows,
      saveAndContinueWithUnsavedChanges,
      discardAndContinueWithUnsavedChanges,
      closeUnsavedChangesDialog,
    },
  };
};

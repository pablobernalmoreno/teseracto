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
  activeCardDate: string;
  activeCardTitle: string;
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
  handleDetailDateChange: (date: string) => void;
  handleDetailTitleChange: (title: string) => void;
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

function normalizeCardDate(creationTime?: string): string {
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
}

function computeTitleFromDate(date: string): string {
  if (!date) {
    return "Dia sin fecha";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-");
    return `Dia ${day}/${month}/${year}`;
  }

  return `Dia ${date}`;
}

export const useMainDashboardState = ({
  initialBooks,
  initialBooksCount,
}: UseMainDashboardStateParams): UseMainDashboardStateResult => {
  const booksData = useDashboardBooksData({ initialBooks, initialBooksCount });
  const uiState = useDashboardUiState();
  const modals = useDashboardModals();
  const [initialDetailRows, setInitialDetailRows] = useState<MainData[]>([]);
  const [detailCardDate, setDetailCardDate] = useState("");
  const [initialDetailDate, setInitialDetailDate] = useState("");
  const [detailCardTitle, setDetailCardTitle] = useState("");
  const [initialDetailTitle, setInitialDetailTitle] = useState("");
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

  const activeCardDate = detailCardDate;
  const activeCardTitle = detailCardTitle;

  const areDetailRowsEqual = (left: MainData[], right: MainData[]) => {
    if (left.length !== right.length) {
      return false;
    }

    for (let index = 0; index < left.length; index += 1) {
      const leftRow = left[index];
      const rightRow = right[index];

      if (
        leftRow.id !== rightRow.id ||
        (leftRow.date ?? "") !== (rightRow.date ?? "") ||
        (leftRow.money ?? "") !== (rightRow.money ?? "")
      ) {
        return false;
      }
    }

    return true;
  };

  const hasUnsavedChanges = useMemo(() => {
    if (!uiState.selectedCardId) {
      return false;
    }

    return (
      !areDetailRowsEqual(uiState.editedRows, initialDetailRows) ||
      detailCardDate !== initialDetailDate ||
      detailCardTitle.trim() !== initialDetailTitle.trim()
    );
  }, [
    uiState.selectedCardId,
    uiState.editedRows,
    initialDetailRows,
    detailCardDate,
    initialDetailDate,
    detailCardTitle,
    initialDetailTitle,
  ]);

  const isUnsavedDialogOpen = pendingNavigationAction !== null;

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // returnValue is deprecated but required for cross-browser unsaved-changes prompt
      (event as BeforeUnloadEvent & { returnValue: string }).returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const openDetailInternal = async (bookId: string | number) => {
    const selectedBook = currentItems.find((item) => item.id === bookId);
    const cardDate = normalizeCardDate(selectedBook?.creationTime);
    // Fetch data before updating UI to avoid waterfall
    const rows = await booksData.fetchDetailRows(bookId, cardDate);
    // Set both states together (they're independent)
    uiState.setActiveCard(bookId);
    uiState.setEditedRows(rows);
    setDetailCardDate(cardDate);
    setInitialDetailDate(cardDate);
    setDetailCardTitle(selectedBook?.title ?? "");
    setInitialDetailTitle(selectedBook?.title ?? "");
    setInitialDetailRows(rows);
  };

  const handleDetailDateChange = (date: string) => {
    setDetailCardDate(date);
    setDetailCardTitle(computeTitleFromDate(date));
    uiState.setEditedRows((prevRows) => prevRows.map((row) => ({ ...row, date })));
  };

  const handleDetailTitleChange = (title: string) => {
    setDetailCardTitle(title);
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
    const cardDate = detailCardDate;
    const rowsToSave = cardDate
      ? uiState.editedRows.map((row) => ({ ...row, date: cardDate }))
      : uiState.editedRows;

    const result = await booksData.saveDetailRows(
      bookId,
      rowsToSave,
      cardDate || undefined,
      detailCardTitle
    );
    if (result.error) {
      modals.showToast("Error al guardar", "error");
      return false;
    }

    void booksData.refreshCurrentPage();

    modals.showToast("Guardado correctamente", "success");

    if (exitAfterSave) {
      uiState.clearDetail();
      setDetailCardDate("");
      setInitialDetailDate("");
      setDetailCardTitle("");
      setInitialDetailTitle("");
      setInitialDetailRows([]);
      return true;
    }

    uiState.setEditedRows(rowsToSave);
    setInitialDetailDate(cardDate);
    setInitialDetailTitle(detailCardTitle);
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
          setDetailCardDate("");
          setInitialDetailDate("");
          setDetailCardTitle("");
          setInitialDetailTitle("");
          setInitialDetailRows([]);
        };
      });
      return;
    }

    uiState.clearDetail();
    setDetailCardDate("");
    setInitialDetailDate("");
    setDetailCardTitle("");
    setInitialDetailTitle("");
    setInitialDetailRows([]);
  };

  const closeUnsavedChangesDialog = () => {
    setPendingNavigationAction(null);
  };

  const discardAndContinueWithUnsavedChanges = () => {
    const pendingAction = pendingNavigationAction;
    setPendingNavigationAction(null);
    uiState.clearDetail();
    setDetailCardDate("");
    setInitialDetailDate("");
    setDetailCardTitle("");
    setInitialDetailTitle("");
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
      activeCardDate,
      activeCardTitle,
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
      handleDetailDateChange,
      handleDetailTitleChange,
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

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { dashboardService } from "./dashboardService";
import { MainData } from "./useItemCardModel";

export interface DashboardCardItem {
  id: string | number;
  title: string;
  description: string;
  content?: MainData[];
}

interface DashboardBooksPage {
  books: DashboardCardItem[];
  count: number;
}

interface DashboardPageModelState {
  items: DashboardCardItem[];
  isLoading: boolean;
  searchQuery: string;
  filteredCount: number;
  currentPage: number;
  totalPages: number;
  currentItems: DashboardCardItem[];
  selectedCardId: string | number | null;
  selectedCardIds: Array<string | number>;
  isDeleteModalOpen: boolean;
  toastOpen: boolean;
  toastMessage: string;
  toastSeverity: "success" | "error";
  editedRows: MainData[];
}

interface DashboardPageModelActions {
  handlePageChange: (_event: React.ChangeEvent<unknown>, value: number) => void;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  openDetail: (bookId: string | number) => Promise<void>;
  clearCardSelection: () => void;
  toggleCardSelection: (cardId: string | number, checked: boolean) => void;
  openDeleteModal: () => void;
  closeDeleteModal: () => void;
  deleteSelectedCards: () => Promise<void>;
  closeToast: () => void;
  handleBackFromDetail: () => void;
  handleSaveDetail: () => Promise<void>;
  handleBookCreated: () => Promise<void>;
  setEditedRows: React.Dispatch<React.SetStateAction<MainData[]>>;
}

const NEW_ITEM_CARD: DashboardCardItem = {
  id: "new-item",
  title: "newItemCard",
  description: "",
};

const ITEMS_PER_PAGE = 5;
const PREFETCH_PAGE_DISTANCE = 1;

const dashboardQueryKeys = {
  userProfile: ["dashboard", "user-profile"] as const,
  booksPage: (ownerId: string, page: number, searchQuery: string) =>
    ["dashboard", "books", ownerId, page, searchQuery.trim()] as const,
  booksByOwner: (ownerId: string) => ["dashboard", "books", ownerId] as const,
};

const toInputDate = (dateStr: string): string => {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return "";
};

const toEditableMoney = (money: string): string => {
  const raw = String(money || "").replaceAll(/[^0-9.,-]+/g, "");
  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");

  if (lastComma === -1 && lastDot === -1) return raw;

  if (lastComma > -1 && lastDot === -1) {
    const decimalsLen = raw.length - lastComma - 1;
    if (decimalsLen === 3) return raw.replaceAll(",", "");
    return `${raw.slice(0, lastComma).replaceAll(".", "")}.${raw.slice(lastComma + 1)}`;
  }

  if (lastDot > -1 && lastComma === -1) {
    const decimalsLen = raw.length - lastDot - 1;
    if (decimalsLen === 3) return raw.replaceAll(".", "");
    return `${raw.slice(0, lastDot).replaceAll(",", "")}.${raw.slice(lastDot + 1)}`;
  }

  if (lastComma > lastDot) {
    return `${raw.slice(0, lastComma).replaceAll(".", "")}.${raw.slice(lastComma + 1)}`;
  }

  return `${raw.slice(0, lastDot).replaceAll(",", "")}.${raw.slice(lastDot + 1)}`;
};

const normalizeRowsForEdit = (rows: MainData[]): MainData[] => {
  return rows.map((row) => ({
    ...row,
    date: toInputDate(row.date),
    money: toEditableMoney(row.money),
  }));
};

export const useDashboardPageModel = (): [DashboardPageModelState, DashboardPageModelActions] => {
  const queryClient = useQueryClient();
  const previousOwnerIdRef = useRef<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCardId, setSelectedCardId] = useState<string | number | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<Array<string | number>>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState<"success" | "error">("success");
  const [editedRows, setEditedRows] = useState<MainData[]>([]);

  const firstPageBookSlots = Math.max(ITEMS_PER_PAGE - 1, 0);
  const setSearchQueryAndResetPage: React.Dispatch<React.SetStateAction<string>> = useCallback(
    (value) => {
      setSearchQuery((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        if (next !== prev) {
          setCurrentPage(1);
        }
        return next;
      });
    },
    []
  );

  const getPageRange = useCallback(
    (page: number) => {
      const from = page <= 1 ? 0 : firstPageBookSlots + (page - 2) * ITEMS_PER_PAGE;
      const pageSize = page <= 1 ? firstPageBookSlots : ITEMS_PER_PAGE;
      const to = Math.max(from, from + pageSize - 1);
      return { from, to };
    },
    [firstPageBookSlots]
  );

  const getTotalPagesFromCount = useCallback(
    (count: number) => {
      return count <= firstPageBookSlots
        ? 1
        : 1 + Math.ceil((count - firstPageBookSlots) / ITEMS_PER_PAGE);
    },
    [firstPageBookSlots]
  );

  const fetchBooksPage = useCallback(
    async (ownerId: string, page: number, query: string): Promise<DashboardBooksPage> => {
      const { from, to } = getPageRange(page);
      const {
        data: bookData,
        error: bookError,
        count,
      } = await dashboardService.fetchBookDataPage({
        ownerId,
        from,
        to,
        searchQuery: query,
      });

      if (bookError) {
        throw bookError;
      }

      const books = (bookData || []).map((book) => ({
        id: book.id,
        title: book.title,
        description: book.description || "",
        content: book.content || [],
      }));

      return {
        books,
        count: count || 0,
      };
    },
    [getPageRange]
  );

  const userProfileQuery = useQuery({
    queryKey: dashboardQueryKeys.userProfile,
    queryFn: async () => {
      const { data: currentProfile, error: currentProfileError } =
        await dashboardService.fetchCurrentUserProfile();
      if (currentProfileError) {
        throw currentProfileError;
      }

      if (currentProfile) {
        return currentProfile;
      }

      const { data: userData, error: userDataError } = await dashboardService.fetchUserData();
      if (userDataError) {
        throw userDataError;
      }

      return userData?.[0] ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const ownerId = userProfileQuery.data?.book_id ?? null;

  useEffect(() => {
    if (previousOwnerIdRef.current === null) {
      previousOwnerIdRef.current = ownerId;
      return;
    }

    if (previousOwnerIdRef.current !== ownerId) {
      queryClient.removeQueries({ queryKey: ["dashboard", "books"] });
      previousOwnerIdRef.current = ownerId;
    }
  }, [ownerId, queryClient]);

  const booksPageQuery = useQuery({
    queryKey: dashboardQueryKeys.booksPage(ownerId || "none", currentPage, searchQuery),
    queryFn: async () => {
      if (!ownerId) {
        return { books: [], count: 0 };
      }
      return await fetchBooksPage(ownerId, currentPage, searchQuery);
    },
    enabled: true,
    placeholderData: ownerId ? keepPreviousData : undefined,
    staleTime: 30 * 1000,
  });

  const items = booksPageQuery.data?.books || [];
  const filteredCount = booksPageQuery.data?.count || 0;
  const totalPages = getTotalPagesFromCount(filteredCount);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  const currentItems = safeCurrentPage === 1 ? [NEW_ITEM_CARD, ...items] : items;
  const isLoading = userProfileQuery.isPending || (!!ownerId && booksPageQuery.isFetching);

  // Ensure currentPage stays within bounds when totalPages changes
  // This prevents query/UI mismatch when items are deleted and totalPages decreases
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      flushSync(() => {
        setCurrentPage(totalPages);
      });
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!ownerId || !booksPageQuery.data) return;

    const totalPageCount = getTotalPagesFromCount(booksPageQuery.data.count);
    const targetPages = [
      safeCurrentPage - PREFETCH_PAGE_DISTANCE,
      safeCurrentPage + PREFETCH_PAGE_DISTANCE,
    ].filter((page) => page >= 1 && page <= totalPageCount);

    targetPages.forEach((targetPage) => {
      void queryClient.prefetchQuery({
        queryKey: dashboardQueryKeys.booksPage(ownerId, targetPage, searchQuery),
        queryFn: () => fetchBooksPage(ownerId, targetPage, searchQuery),
        staleTime: 30 * 1000,
      });
    });
  }, [
    ownerId,
    booksPageQuery.data,
    safeCurrentPage,
    searchQuery,
    fetchBooksPage,
    getTotalPagesFromCount,
    queryClient,
  ]);

  const updateCurrentPageBookContent = useCallback(
    (bookId: string | number, content: MainData[]) => {
      if (!ownerId) return;

      queryClient.setQueryData<DashboardBooksPage>(
        dashboardQueryKeys.booksPage(ownerId, currentPage, searchQuery),
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            books: prev.books.map((it) => (it.id === bookId ? { ...it, content } : it)),
          };
        }
      );
    },
    [currentPage, ownerId, queryClient, searchQuery]
  );

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const handleLoadContent = async (bookId: string | number): Promise<MainData[]> => {
    const existing = items.find((it) => it.id === bookId);
    if (!existing) return [];
    if (existing.content && existing.content.length > 0) {
      return existing.content;
    }

    try {
      const { data, error } = await dashboardService.fetchBookContent(bookId);
      if (!error && data?.content) {
        const content = data.content as MainData[];
        updateCurrentPageBookContent(bookId, content);
        return content;
      }
    } catch (err) {
      console.error("Error loading book content:", err);
    }

    return [];
  };

  const openDetail = async (bookId: string | number) => {
    const existing = items.find((it) => it.id === bookId);
    if (!existing) return;

    setSelectedCardIds([]);
    setIsDeleteModalOpen(false);

    const content =
      existing.content && existing.content.length > 0
        ? existing.content
        : await handleLoadContent(bookId);

    setEditedRows(normalizeRowsForEdit(content || []));
    setSelectedCardId(bookId);
  };

  const toggleCardSelection = (cardId: string | number, checked: boolean) => {
    setSelectedCardIds((prev) => {
      if (checked) {
        if (prev.includes(cardId)) return prev;
        return [...prev, cardId];
      }

      return prev.filter((id) => id !== cardId);
    });
  };

  const clearCardSelection = () => {
    setSelectedCardIds([]);
    setIsDeleteModalOpen(false);
  };

  const openDeleteModal = () => {
    if (selectedCardIds.length === 0) return;
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };

  const closeToast = () => {
    setToastOpen(false);
  };

  const deleteBooksMutation = useMutation({
    mutationFn: async (bookIds: Array<string | number>) => {
      const { error } = await dashboardService.deleteBooks(bookIds);
      if (error) {
        throw error;
      }
      return bookIds.length;
    },
  });

  const deleteSelectedCards = useCallback(async () => {
    if (selectedCardIds.length === 0) return;

    try {
      const deleteCount = await deleteBooksMutation.mutateAsync(selectedCardIds);

      setSelectedCardIds([]);
      setIsDeleteModalOpen(false);
      setToastSeverity("success");
      setToastMessage(`Se eliminaron ${deleteCount} elemento${deleteCount === 1 ? "" : "s"}.`);
      setToastOpen(true);
      setCurrentPage((prev) => {
        const nextCount = Math.max(0, filteredCount - deleteCount);
        const nextTotalPages = getTotalPagesFromCount(nextCount);
        return Math.min(prev, nextTotalPages);
      });

      if (ownerId) {
        await queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.booksByOwner(ownerId),
        });
      }
    } catch (error) {
      console.error("Error deleting books:", error);
      setToastSeverity("error");
      setToastMessage("No se pudieron eliminar los elementos seleccionados.");
      setToastOpen(true);
    }
  }, [
    deleteBooksMutation,
    filteredCount,
    getTotalPagesFromCount,
    ownerId,
    queryClient,
    selectedCardIds,
  ]);

  const updateBookMutation = useMutation({
    mutationFn: async ({ bookId, content }: { bookId: string | number; content: MainData[] }) => {
      const { error } = await dashboardService.updateBookContent(bookId, content);
      if (error) {
        throw error;
      }
      return { bookId, content };
    },
  });

  const handleBackFromDetail = () => {
    setSelectedCardId(null);
    setEditedRows([]);
  };

  const handleSaveDetail = async () => {
    if (selectedCardId === null || selectedCardId === undefined) return;

    const rowsToSave = editedRows.filter(
      (row) => row.date.trim() !== "" || row.money.trim() !== ""
    );

    try {
      await updateBookMutation.mutateAsync({
        bookId: selectedCardId,
        content: rowsToSave,
      });

      updateCurrentPageBookContent(selectedCardId, rowsToSave);
      setSelectedCardId(null);
      setEditedRows([]);
      setToastSeverity("success");
      setToastMessage("Cambios guardados correctamente.");
      setToastOpen(true);

      if (ownerId) {
        await queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.booksByOwner(ownerId),
        });
      }
    } catch (error) {
      console.error("Error saving book content:", error);
      setToastSeverity("error");
      setToastMessage("No se pudieron guardar los cambios.");
      setToastOpen(true);
    }
  };

  const handleBookCreated = useCallback(async () => {
    if (ownerId) {
      await queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.booksByOwner(ownerId),
      });
    }

    if (safeCurrentPage === 1) {
      return;
    }

    setCurrentPage(1);
  }, [ownerId, queryClient, safeCurrentPage]);

  const state: DashboardPageModelState = {
    items,
    isLoading,
    searchQuery,
    filteredCount,
    currentPage: safeCurrentPage,
    totalPages,
    currentItems,
    selectedCardId,
    selectedCardIds,
    isDeleteModalOpen,
    toastOpen,
    toastMessage,
    toastSeverity,
    editedRows,
  };

  const actions: DashboardPageModelActions = {
    handlePageChange,
    setSearchQuery: setSearchQueryAndResetPage,
    openDetail,
    clearCardSelection,
    toggleCardSelection,
    openDeleteModal,
    closeDeleteModal,
    deleteSelectedCards,
    closeToast,
    handleBackFromDetail,
    handleSaveDetail,
    handleBookCreated,
    setEditedRows,
  };

  return [state, actions];
};

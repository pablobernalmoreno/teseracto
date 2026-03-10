import { useCallback, useEffect, useRef, useState } from "react";
import { dashboardService } from "./dashboardService";
import { MainData } from "./useItemCardModel";

export interface DashboardCardItem {
  id: string | number;
  title: string;
  description: string;
  content?: MainData[];
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
  toggleCardSelection: (cardId: string | number, checked: boolean) => void;
  openDeleteModal: () => void;
  closeDeleteModal: () => void;
  deleteSelectedCards: () => Promise<void>;
  closeToast: () => void;
  handleBackFromDetail: () => void;
  handleSaveDetail: () => void;
  handleBookCreated: () => Promise<void>;
  setEditedRows: React.Dispatch<React.SetStateAction<MainData[]>>;
}

const NEW_ITEM_CARD: DashboardCardItem = {
  id: "new-item",
  title: "newItemCard",
  description: "",
};

const ITEMS_PER_PAGE = 5;

const toInputDate = (dateStr: string): string => {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return "";
};

const toEditableMoney = (money: string): string => {
  const raw = String(money || "").replace(/[^0-9.,-]+/g, "");
  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");

  if (lastComma === -1 && lastDot === -1) return raw;

  if (lastComma > -1 && lastDot === -1) {
    const decimalsLen = raw.length - lastComma - 1;
    if (decimalsLen === 3) return raw.replace(/,/g, "");
    return `${raw.slice(0, lastComma).replace(/\./g, "")}.${raw.slice(lastComma + 1)}`;
  }

  if (lastDot > -1 && lastComma === -1) {
    const decimalsLen = raw.length - lastDot - 1;
    if (decimalsLen === 3) return raw.replace(/\./g, "");
    return `${raw.slice(0, lastDot).replace(/,/g, "")}.${raw.slice(lastDot + 1)}`;
  }

  if (lastComma > lastDot) {
    return `${raw.slice(0, lastComma).replace(/\./g, "")}.${raw.slice(lastComma + 1)}`;
  }

  return `${raw.slice(0, lastDot).replace(/,/g, "")}.${raw.slice(lastDot + 1)}`;
};

const normalizeRowsForEdit = (rows: MainData[]): MainData[] => {
  return rows.map((row) => ({
    ...row,
    date: toInputDate(row.date),
    money: toEditableMoney(row.money),
  }));
};

export const useDashboardPageModel = (): [
  DashboardPageModelState,
  DashboardPageModelActions,
] => {
  const [items, setItems] = useState<DashboardCardItem[]>([NEW_ITEM_CARD]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCardId, setSelectedCardId] = useState<string | number | null>(
    null,
  );
  const [selectedCardIds, setSelectedCardIds] = useState<Array<string | number>>(
    [],
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState<"success" | "error">(
    "success",
  );
  const [editedRows, setEditedRows] = useState<MainData[]>([]);
  const hasLoaded = useRef(false);

  const query = searchQuery.trim().toLowerCase();
  const regularItems = items.filter((item) => item.id !== NEW_ITEM_CARD.id);
  const filteredRegularItems = regularItems.filter((item) => {
    if (!query) return true;
    const title = item.title?.toLowerCase() || "";
    const description = item.description?.toLowerCase() || "";
    return title.includes(query) || description.includes(query);
  });
  const filteredItems = [NEW_ITEM_CARD, ...filteredRegularItems];

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setCurrentPage(value);
  };

  const loadCardItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: userData } = await dashboardService.fetchUserData();
      const { data: bookData, error: bookError } =
        await dashboardService.fetchBookData();

      if (bookError || !bookData?.length) {
        setItems([NEW_ITEM_CARD]);
        return;
      }

      const user = userData?.[0];
      const ownedData = bookData.filter((book) => book.owner_id === user?.book_id);
      const sortedOwnedData = [...ownedData].sort((a, b) => {
        const aTime = a.creationTime ? new Date(a.creationTime).getTime() : 0;
        const bTime = b.creationTime ? new Date(b.creationTime).getTime() : 0;

        if (aTime !== bTime) return bTime - aTime;

        return String(b.id).localeCompare(String(a.id));
      });

      const uniqueBooks = Array.from(
        new Map(sortedOwnedData.map((book) => [book.id, book])).values(),
      ).map((book) => ({
        id: book.id,
        title: book.title,
        description: book.description || "",
        content: book.content || [],
      }));

      setItems([NEW_ITEM_CARD, ...uniqueBooks]);
    } catch (error) {
      console.error("Error loading data:", error);
      setItems([NEW_ITEM_CARD]);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        setItems((prev) =>
          prev.map((it) => (it.id === bookId ? { ...it, content } : it)),
        );
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

  const deleteSelectedCards = useCallback(async () => {
    if (selectedCardIds.length === 0) return;

    try {
      const deleteCount = selectedCardIds.length;
      const { error } = await dashboardService.deleteBooks(selectedCardIds);
      if (error) {
        console.error("Error deleting books:", error);
        setToastSeverity("error");
        setToastMessage("Could not delete selected items.");
        setToastOpen(true);
        return;
      }

      setItems((prev) =>
        prev.filter((item) =>
          item.id === NEW_ITEM_CARD.id ? true : !selectedCardIds.includes(item.id),
        ),
      );
      setSelectedCardIds([]);
      setIsDeleteModalOpen(false);
      setToastSeverity("success");
      setToastMessage(
        `Deleted ${deleteCount} item${deleteCount === 1 ? "" : "s"}.`,
      );
      setToastOpen(true);
    } catch (error) {
      console.error("Error deleting books:", error);
      setToastSeverity("error");
      setToastMessage("Could not delete selected items.");
      setToastOpen(true);
    }
  }, [selectedCardIds]);

  const handleBackFromDetail = () => {
    setSelectedCardId(null);
    setEditedRows([]);
  };

  const handleSaveDetail = () => {
    if (selectedCardId == null) return;
    setItems((prev) =>
      prev.map((it) =>
        it.id === selectedCardId ? { ...it, content: editedRows } : it,
      ),
    );
    setSelectedCardId(null);
    setEditedRows([]);
  };

  const handleBookCreated = useCallback(async () => {
    await loadCardItems();
    setCurrentPage(1);
  }, [loadCardItems]);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    loadCardItems();
  }, [loadCardItems]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage((prevPage) => {
      const maxPage = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
      return Math.min(prevPage, maxPage);
    });
  }, [filteredItems.length]);

  const state: DashboardPageModelState = {
    items,
    isLoading,
    searchQuery,
    filteredCount: filteredRegularItems.length,
    currentPage,
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
    setSearchQuery,
    openDetail,
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

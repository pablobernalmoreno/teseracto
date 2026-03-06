"use client";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { AppBarMenu } from "../components/appBarMenu/AppBarMenu";
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
  Pagination,
} from "@mui/material";
import { dashboardService } from "@/modules/dashboard/model/dashboardService";
import { MainData } from "@/modules/dashboard/model/useItemCardModel";
import dynamic from "next/dynamic";
import "./mainStyles.css";
import DataTable from "../components/dataTable/DataTable";

const ItemCardPresenter = dynamic(() =>
  import("@/modules/dashboard/presenters/ItemCardPresenter").then((mod) => ({
    default: mod.ItemCardPresenter,
  })),
);

const NEW_ITEM_CARD = { id: "new-item", title: "newItemCard", description: "" };

const page = () => {
  const [items, setItems] = useState<
    Array<{
      id: string | number;
      title: string;
      description: string;
      content?: MainData[];
    }>
  >([NEW_ITEM_CARD]);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoaded = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setCurrentPage(value);
  };

  // Load full content for a book (used by openDetail)
  const handleLoadContent = async (bookId: string | number) => {
    const existing = items.find((it) => it.id === bookId);
    if (!existing) return;
    if (existing.content && existing.content.length > 0) return; // already loaded

    try {
      const { data, error } = await dashboardService.fetchBookContent(bookId);
      if (!error && data?.content) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === bookId ? { ...it, content: data.content || [] } : it,
          ),
        );
      }
    } catch (err) {
      console.error("Error loading book content:", err);
    }
  };

  const [selectedCardId, setSelectedCardId] = useState<string | number | null>(
    null,
  );
  const [editedRows, setEditedRows] = useState<MainData[]>([]);

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

        // Deterministic fallback ordering when timestamps are equal/missing.
        return String(b.id).localeCompare(String(a.id));
      });

      // Deduplicate by ID to prevent duplicate keys
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

  const handleBookCreated = useCallback(async () => {
    await loadCardItems();
    setCurrentPage(1);
  }, [loadCardItems]);

  // Helpers: convert date formats and format currency for display
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

  const openDetail = async (bookId: string | number) => {
    // Ensure content is loaded first
    const existing = items.find((it) => it.id === bookId);
    if (!existing) return;
    if (!existing.content || existing.content.length === 0) {
      await handleLoadContent(bookId);
    }
    const updated = items.find((it) => it.id === bookId);
    // Normalize dates to yyyy-mm-dd for the date input and format money for display
    const normalized = (updated?.content || []).map((r) => {
      // normalize money to an unformatted numeric string suitable for editing
      const raw = String(r.money || "").toString().replace(/[^0-9.,-]+/g, "");
      // reuse the parse logic to remove thousands separators but keep decimals
      const parseParts = (s: string) => {
        const cleaned = s;
        const lastComma = cleaned.lastIndexOf(",");
        const lastDot = cleaned.lastIndexOf(".");
        if (lastComma === -1 && lastDot === -1) return { intPart: cleaned, frac: undefined };
        if (lastComma > -1 && lastDot === -1) {
          const decimalsLen = cleaned.length - lastComma - 1;
          if (decimalsLen === 3) return { intPart: cleaned.replace(/,/g, ""), frac: undefined };
          return { intPart: cleaned.slice(0, lastComma).replace(/\./g, ""), frac: cleaned.slice(lastComma + 1) };
        }
        if (lastDot > -1 && lastComma === -1) {
          const decimalsLen = cleaned.length - lastDot - 1;
          if (decimalsLen === 3) return { intPart: cleaned.replace(/\./g, ""), frac: undefined };
          return { intPart: cleaned.slice(0, lastDot).replace(/,/g, ""), frac: cleaned.slice(lastDot + 1) };
        }
        if (lastComma > lastDot) return { intPart: cleaned.slice(0, lastComma).replace(/\./g, ""), frac: cleaned.slice(lastComma + 1) };
        return { intPart: cleaned.slice(0, lastDot).replace(/,/g, ""), frac: cleaned.slice(lastDot + 1) };
      };
      const parts = parseParts(raw);
      const moneyStr = parts.frac ? `${parts.intPart}.${parts.frac}` : parts.intPart;
      return {
        ...r,
        date: toInputDate(r.date),
        // keep raw numeric string for editing (no formatting)
        money: moneyStr,
      };
    });
    setEditedRows(normalized);
    setSelectedCardId(bookId);
  };

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

  const handleRowChange = (
    index: number,
    field: "date" | "money",
    value: string,
  ) => {
    setEditedRows((prev) => {
      const copy = prev.map((r) => ({ ...r }));
      if (field === "date") {
        copy[index] = { ...copy[index], date: value } as MainData;
      } else {
        // keep raw input for money while editing; format only for display
        copy[index] = { ...copy[index], money: value } as MainData;
      }
      return copy;
    });
  };

  useEffect(() => {
    // Prevent double-loading in strict mode
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    loadCardItems();
  }, [loadCardItems]);

  return (
    <>
      <AppBarMenu isLogged />
      <Paper elevation={3} className="dashboard_header">
        <Typography variant="h4">Dashboard</Typography>
      </Paper>
      <Box className="dashboard_background">
        <Box className="dashboard_container">
          {isLoading ? (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mt: 4,
              }}
            >
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
                  <Button onClick={handleBackFromDetail} sx={{ mr: 1 }}>
                    Back
                  </Button>
                  <Button variant="contained" onClick={handleSaveDetail}>
                    Save
                  </Button>
                </Box>
              </Box>
              <DataTable rows={editedRows} editable onRowsChange={setEditedRows} />
            </Paper>
          ) : (
            currentItems.map((item) => (
              <ItemCardPresenter
                key={item.id}
                cardId={item.id}
                name={item.title}
                description={item.description}
                content={item.content}
                onOpenDetail={openDetail}
                onBookCreated={handleBookCreated}
              />
            ))
          )}
          {!selectedCardId && (
            <Box className="dashboard_pagination">
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="large"
                disabled={isLoading}
              />
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
};

export default page;

"use client";

import { useState, useTransition } from "react";
import {
  fetchBooksPage,
  createBook as createBookFn,
  fetchBookContent,
  type BookData,
} from "@/app/actions/dashboard";
import type { MainData } from "@/types/dashboard";

const ITEMS_PER_PAGE = 5;

interface UseDashboardBooksDataParams {
  initialBooks: BookData[];
  initialBooksCount: number;
}

interface UseDashboardBooksDataResult {
  isPending: boolean;
  currentPage: number;
  searchQuery: string;
  books: BookData[];
  booksCount: number;
  totalPages: number;
  filteredCount: number;
  allItems: BookData[];
  libraryCount: number;
  handlePageChange: (_: unknown, page: number) => void;
  handleSearchChange: (query: string) => void;
  refreshCurrentPage: () => Promise<void>;
  refreshFirstPage: () => Promise<void>;
  addNewBook: (book: BookData) => void;
  fetchDetailRows: (bookId: string | number, fixedDate?: string) => Promise<MainData[]>;
  saveDetailRows: (bookId: string | number, rows: MainData[]) => Promise<{ error: string | null }>;
}

export const useDashboardBooksData = ({
  initialBooks,
  initialBooksCount,
}: UseDashboardBooksDataParams): UseDashboardBooksDataResult => {
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<BookData[]>(initialBooks);
  const [booksCount, setBooksCount] = useState(initialBooksCount);

  const totalPages = Math.ceil(booksCount / ITEMS_PER_PAGE);
  const filteredCount = booksCount;
  const allItems: BookData[] = [{ id: "new-item", title: "newItemCard", content: [] }, ...books];
  const libraryCount = books.length;

  const loadPage = (page: number, query: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      startTransition(async () => {
        const result = await fetchBooksPage(page, query, ITEMS_PER_PAGE);
        if (result.data) {
          setBooks(result.data);
          setBooksCount(result.count);
        }
        resolve();
      });
    });
  };

  const handlePageChange = (_: unknown, page: number) => {
    setCurrentPage(page);
    void loadPage(page - 1, searchQuery);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    void loadPage(0, query);
  };

  const refreshCurrentPage = (): Promise<void> => {
    return loadPage(Math.max(0, currentPage - 1), searchQuery);
  };

  const refreshFirstPage = (): Promise<void> => {
    setCurrentPage(1);
    return loadPage(0, searchQuery);
  };

  const addNewBook = (book: BookData) => {
    // Add the new book to the beginning of the list
    setBooks((prevBooks) => [book, ...prevBooks]);
    // Increment the count
    setBooksCount((prevCount) => prevCount + 1);
  };

  const fetchDetailRows = async (
    bookId: string | number,
    fixedDate?: string
  ): Promise<MainData[]> => {
    const result = await fetchBookContent(String(bookId));
    if (!result.data) {
      return [];
    }
    const rows = result.data.content || [];

    if (!fixedDate) {
      return rows;
    }

    return rows.map((row) => ({
      ...row,
      date: row.date === undefined || row.date === null || row.date === "" ? fixedDate : row.date,
    }));
  };

  const saveDetailRows = async (
    bookId: string | number,
    rows: MainData[]
  ): Promise<{ error: string | null }> => {
    const result = await createBookFn("", rows, String(bookId));
    return { error: result.error ?? null };
  };

  return {
    isPending,
    currentPage,
    searchQuery,
    books,
    booksCount,
    totalPages,
    filteredCount,
    allItems,
    libraryCount,
    handlePageChange,
    handleSearchChange,
    refreshCurrentPage,
    refreshFirstPage,
    addNewBook,
    fetchDetailRows,
    saveDetailRows,
  };
};

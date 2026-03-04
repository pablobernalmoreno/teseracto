"use client";
import React, { useEffect, useState, useRef } from "react";
import { AppBarMenu } from "../components/appBarMenu/AppBarMenu";
import {
  Box,
  CircularProgress,
  Paper,
  Typography,
  Pagination,
} from "@mui/material";
import { dashboardService } from "@/modules/dashboard/model/dashboardService";
import { MainData } from "@/modules/dashboard/model/useItemCardModel";
import dynamic from "next/dynamic";
import "./mainStyles.css";

const ItemCardPresenter = dynamic(() =>
  import("@/modules/dashboard/presenters/ItemCardPresenter").then((mod) => ({
    default: mod.ItemCardPresenter,
  })),
);

const page = () => {
  const [items, setItems] = useState<
    Array<{
      id: string | number;
      title: string;
      description: string;
      content?: MainData[];
    }>
  >([{ id: "new-item", title: "newItemCard", description: "" }]);
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

  useEffect(() => {
    // Prevent double-loading in strict mode
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    const loadData = async () => {
      try {
        const { data: userData } = await dashboardService.fetchUserData();
        const { data: bookData, error: bookError } =
          await dashboardService.fetchBookData();

        if (!bookError && bookData?.length > 0) {
          const user = userData?.[0];
          const ownedData = bookData.filter(
            (book) => book.owner_id === user?.book_id,
          );

          // Deduplicate by ID to prevent duplicate keys
          const uniqueBooks = Array.from(
            new Map(ownedData.map((book) => [book.id, book])).values(),
          ).map((book) => ({
            id: book.id,
            title: book.title,
            description: book.description || "",
            content: book.content || [],
          }));

          setItems((prevItems) => [...prevItems, ...uniqueBooks]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

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
          ) : (
            currentItems.map((item) => (
              <ItemCardPresenter
                key={item.id}
                cardId={item.id}
                name={item.title}
                description={item.description}
                content={item.content}
              />
            ))
          )}
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
        </Box>
      </Box>
    </>
  );
};

export default page;

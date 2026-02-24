"use client";
import React, { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { AppBarMenu } from "../components/appBarMenu/AppBarMenu";
import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import { dashboardService } from "@/modules/dashboard/model/dashboardService";
import dynamic from "next/dynamic";
import "./mainStyles.css";

const ItemCardPresenter = dynamic(() =>
  import("@/modules/dashboard/presenters/ItemCardPresenter").then((mod) => ({
    default: mod.ItemCardPresenter,
  })),
);

const page = () => {
  const [items, setItems] = useState<
    Array<{ id: number; title: string; description: string }>
  >([{ id: 0, title: "newItemCard", description: "" }]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const { data } = await dashboardService.getSession();

      if (!data.session) {
        redirect("/");
      }

      const { data: userData } = await dashboardService.fetchUserData();
      const { data: bookData, error: bookError } =
        await dashboardService.fetchBookData();

      if (!bookError && bookData?.length > 0) {
        const user = userData?.[0];
        const ownedData = bookData.filter(
          (book) => book.owner_id === user?.book_id,
        );
        setItems((prevItems) => [...prevItems, ...ownedData]);
      }
      setIsLoading(false);
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
            items.map((item) => (
              <ItemCardPresenter
                key={item.id}
                cardId={item.id}
                name={item.title}
                description={item.description}
              />
            ))
          )}
        </Box>
      </Box>
    </>
  );
};

export default page;

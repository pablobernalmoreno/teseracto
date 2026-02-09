"use client";
import React, { useEffect } from "react";
import { redirect } from "next/navigation";
import { AppBarMenu } from "../components/appBarMenu/AppBarMenu";
import { Box, Paper, Typography } from "@mui/material";
import { ItemCardPresenter } from "@/modules/dashboard/presenters";
import { dashboardService } from "@/modules/dashboard/model/dashboardService";
import "./mainStyles.css";

const page = () => {
  const [items, setItems] = React.useState<
    Array<{ id: number; title: string; description: string }>
  >([{ id: 0, title: "newItemCard", description: "" }]);

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
          {items.map((item) => (
            <ItemCardPresenter
              key={item.id}
              name={item.title}
              description={item.description}
            />
          ))}
        </Box>
      </Box>
    </>
  );
};

export default page;

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
    Array<{ id: number; name: string; description: string }>
  >([{ id: 0, name: "newItemCard", description: "" }]);

  useEffect(() => {
    const loadData = async () => {
      const { data } = await dashboardService.getSession();

      if (!data.session) {
        redirect("/");
      }

      const userData = await dashboardService.fetchUserData();
      const bookData = await dashboardService.fetchBookData();
      if (!bookData.error && bookData.data.length > 0) {
        setItems((prevItems) => [...prevItems, ...bookData.data]);
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
            <ItemCardPresenter key={item.id} {...item} />
          ))}
        </Box>
      </Box>
    </>
  );
};

export default page;

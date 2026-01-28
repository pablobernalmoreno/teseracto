"use client";
import React, { useEffect } from "react";
import { redirect } from "next/navigation";
import { AppBarMenu } from "../components/appBarMenu/AppBarMenu";
import { Box, Paper, Typography } from "@mui/material";
import { ItemCardPresenter } from "@/modules/dashboard/presenters";
import { dashboardService } from "@/modules/dashboard/model/dashboardService";
import "./mainStyles.css";

const page = () => {
  const mappedItems = [
    { id: 1, name: "Lizard", description: "Lizards are" },
    { id: 2, name: "Iguana", description: "Iguanas are large lizards" },
    {
      id: 3,
      name: "Chameleon",
      description: "Chameleons are known for their color-changing abilities",
    },
  ];

  const newItem = { id: 4, name: "newItemCard", description: "" };
  mappedItems.unshift(newItem);

  useEffect(() => {
    const loadData = async () => {
      const { data } = await dashboardService.getSession();

      if (!data.session) {
        redirect("/");
      }

      await dashboardService.fetchUserData();
      await dashboardService.fetchBookData();
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
          {mappedItems.map((item) => (
            <ItemCardPresenter key={item.id} {...item} />
          ))}
        </Box>
      </Box>
    </>
  );
};

export default page;

import React from "react";
import { AppBarMenu } from "../components/appBarMenu/AppBarMenu";
import { Box, Paper, Typography } from "@mui/material";
import { ItemCard } from "../components/dashboard/ItemCard";
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
  return (
    <>
      <AppBarMenu isLogged />
      <Paper elevation={3} className="dashboard_header">
        <Typography variant="h4">Dashboard</Typography>
      </Paper>
      <Box className="dashboard_background">
        <Box className="dashboard_container">
          {mappedItems.map((item) => (
            <ItemCard key={item.id} {...item} />
          ))}
        </Box>
      </Box>
    </>
  );
};

export default page;

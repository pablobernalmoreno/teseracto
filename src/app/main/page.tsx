"use client";
import React, { useEffect } from "react";
import { AppBarMenu } from "../components/appBarMenu/AppBarMenu";
import { Box, Paper, Typography } from "@mui/material";
import { ItemCard } from "../components/dashboard/ItemCard";
import supabase from "@/config/supabaseClient";
import "./mainStyles.css";
const getData = async () => {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  const { data: userData, error: userError } = await supabase
    .from("user_profile")
    .select();
  if (
    sessionData.session!.user.role === "authenticated" &&
    userData?.length === 0
  ) {
    const uuid = crypto.randomUUID();
    await supabase
      .from("user_profile")
      .insert([{ id: sessionData?.session?.user.id, book_id: uuid }])
      .select();
  }
};

const getBookData = async () => {
  const { data: userData, error: userDataError } = await supabase
    .from("user_profile")
    .select();
  const { data: bookData, error: bookDataError } = await supabase
    .from("user_books")
    .select();

  console.log({ userData, bookData });
};

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
    getData();
    getBookData();
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
            <ItemCard key={item.id} {...item} />
          ))}
        </Box>
      </Box>
    </>
  );
};

export default page;

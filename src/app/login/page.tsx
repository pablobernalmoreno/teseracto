"use client";
import { Box, Typography } from "@mui/material";
import React from "react";
import "./loginStyles.css";

const page = () => {
  return (
    <div className="login_container">
      <Typography className="login_title" variant="h4">
        Iniciar Sesión
      </Typography>
      <Box className='login_form_container'></Box>
    </div>
  );
};

export default page;

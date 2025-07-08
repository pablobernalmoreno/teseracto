"use client";
import { AppBar, Box, Button, IconButton, Toolbar } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import React from "react";
import "./AppBarMenuStyles.css";

export const AppBarMenu = () => {
  return (
    <Box className="appbar_container">
      <AppBar className="appbar" position="static">
        <Toolbar className="toolbar">
          <Box>
            <Button className="appbar_buttons">Nosotros</Button>
            <Button href="/pricing" className="appbar_buttons">
              Precios
            </Button>
          </Box>
          <Box>
            <Button className="appbar_buttons" href="/login">
              Ingresar <ArrowForwardIcon />
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

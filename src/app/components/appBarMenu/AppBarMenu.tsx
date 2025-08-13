"use client";
import { AppBar, Box, Button, Toolbar } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MenuIcon from "@mui/icons-material/Menu";
import React from "react";
import "./AppBarMenuStyles.css";

const notLoggedInButtons = () => {
  return (
    <>
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
    </>
  );
};

const loggedInButtons = () => {
  return (
    <>
      <Box>
        <Button className="appbar_buttons">
          Salir
        </Button>
      </Box>
      <Box>
        <Button className="appbar_buttons" href="/login">
          <NotificationsIcon />
        </Button>
      </Box>
    </>
  );
};

export const AppBarMenu = ({ isLogged = false }) => {
  return (
    <Box className="appbar_container">
      <AppBar className="appbar" position="static">
        <Toolbar className="toolbar">
          {isLogged ? loggedInButtons() : notLoggedInButtons()}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

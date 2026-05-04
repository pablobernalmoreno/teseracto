"use client";

import { AppBar, Box, Button, Toolbar } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import SettingsBrightnessOutlinedIcon from "@mui/icons-material/SettingsBrightnessOutlined";
import InsightsIcon from "@mui/icons-material/Insights";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./AppBarMenuStyles.css";
import { loginService } from "@/features/login/model/loginService";

type AppBarMenuVariant = "authenticated" | "public";
type ThemeMode = "system" | "light" | "dark";

const THEME_STORAGE_KEY = "teseracto-theme-mode";

function applyThemeMode(mode: ThemeMode) {
  if (globalThis.window === undefined) return;

  const root = globalThis.document.documentElement;
  if (mode === "system") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = mode;
  }
}

function getStoredThemeMode(): ThemeMode {
  const storedTheme = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
    return storedTheme;
  }
  return "system";
}

interface AppBarMenuProps {
  variant?: AppBarMenuVariant;
  onShowHistory?: () => void;
}

const notLoggedInButtons = () => {
  return (
    <>
      <Box className="appbar_nav_links" aria-label="Secciones informativas">
        <Button className="appbar_buttons" component={Link} href="/">
          Inicio
        </Button>
        <Button className="appbar_buttons" component={Link} href="/pricing">
          Precios
        </Button>
      </Box>
      <Box className="appbar_actions">
        <Button className="appbar_buttons appbar_login" component={Link} href="/login">
          Ingresar
        </Button>
        <Button className="appbar_buttons appbar_cta" component={Link} href="/register">
          Crear cuenta <ArrowForwardIcon />
        </Button>
      </Box>
    </>
  );
};

const loggedInButtons = (onLogout: () => Promise<void>, onShowHistory?: () => void) => {
  return (
    <>
      <Box>
        <Box
          className="appbar_brand"
          component={Link}
          href="/"
          aria-label="Ir al inicio de Teseracto"
        >
          <span className="appbar_brand_mark" aria-hidden="true" />
          <span className="appbar_brand_name">Teseracto</span>
        </Box>
        <Button className="appbar_buttons" onClick={onLogout}>
          Salir
        </Button>
      </Box>
      <Box>
        <Button className="appbar_buttons" href="/login" aria-label="Notificaciones">
          <NotificationsIcon aria-hidden="true" />
        </Button>
        <Button
          className="appbar_buttons"
          onClick={onShowHistory}
          aria-label="Historial y análisis"
        >
          <InsightsIcon aria-hidden="true" />
        </Button>
        <Button className="appbar_buttons" href="/login" aria-label="Perfil de usuario">
          <AccountCircleIcon aria-hidden="true" />
        </Button>
      </Box>
    </>
  );
};

export const AppBarMenu = ({ variant = "public", onShowHistory }: AppBarMenuProps) => {
  const router = useRouter();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredThemeMode());

  useEffect(() => {
    applyThemeMode(themeMode);
    globalThis.localStorage?.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const handleLogout = async () => {
    await loginService.signOut();
    router.replace("/");
  };

  const handleToggleTheme = () => {
    let nextThemeMode: ThemeMode;
    if (themeMode === "system") {
      nextThemeMode = "light";
    } else if (themeMode === "light") {
      nextThemeMode = "dark";
    } else {
      nextThemeMode = "system";
    }

    setThemeMode(nextThemeMode);
  };

  const themeToggleIcon = useMemo(() => {
    if (themeMode === "light") return <LightModeOutlinedIcon fontSize="small" />;
    if (themeMode === "dark") return <DarkModeOutlinedIcon fontSize="small" />;
    return <SettingsBrightnessOutlinedIcon fontSize="small" />;
  }, [themeMode]);

  const themeToggleLabel = useMemo(() => {
    if (themeMode === "light") return "Tema: Claro";
    if (themeMode === "dark") return "Tema: Oscuro";
    return "Tema: Sistema";
  }, [themeMode]);

  const isAuthenticated = variant === "authenticated";

  return (
    <Box component="header" className="appbar_container">
      <AppBar className="appbar" position="static">
        <Toolbar component="nav" aria-label="Navegación principal" className="toolbar">
          {process.env.NODE_ENV === "development" && (
            <Button
              className="appbar_buttons appbar_theme_toggle"
              onClick={handleToggleTheme}
              aria-label="Cambiar tema"
              suppressHydrationWarning
            >
              {themeToggleIcon}
              {themeToggleLabel}
            </Button>
          )}
          {isAuthenticated ? loggedInButtons(handleLogout, onShowHistory) : notLoggedInButtons()}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

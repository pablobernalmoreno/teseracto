"use client";

import { AppBar, Box, Button, Toolbar, Tooltip } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import StoreIcon from "@mui/icons-material/Store";
import BookIcon from "@mui/icons-material/Book";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import SettingsBrightnessOutlinedIcon from "@mui/icons-material/SettingsBrightnessOutlined";
import InsightsIcon from "@mui/icons-material/Insights";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "./AppBarMenuStyles.css";
import { loginService } from "@/features/login/model/loginService";

type AppBarMenuVariant = "authenticated" | "public";
type AppBarActiveSection = "books" | "pricing" | "history";
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
  onShowPricing?: () => void;
  onShowBooks?: () => void;
  activeSection?: AppBarActiveSection;
}

const notLoggedInButtons = (pathname: string) => {
  const showHomeButton = pathname !== "/";

  return (
    <>
      <Box className="appbar_nav_links" aria-label="Secciones informativas">
        {showHomeButton && (
          <Tooltip title="Ir al inicio" arrow>
            <Button className="appbar_buttons" component={Link} href="/">
              Inicio
            </Button>
          </Tooltip>
        )}
        <Tooltip title="Ver planes" arrow>
          <Button className="appbar_buttons" component={Link} href="/pricing">
            Planes
          </Button>
        </Tooltip>
      </Box>
      <Box className="appbar_actions">
        <Tooltip title="Iniciar sesión" arrow>
          <Button className="appbar_buttons appbar_login" component={Link} href="/login">
            Ingresar
          </Button>
        </Tooltip>
        <Tooltip title="Crear una cuenta" arrow>
          <Button className="appbar_buttons appbar_cta" component={Link} href="/register">
            Crear cuenta <ArrowForwardIcon />
          </Button>
        </Tooltip>
      </Box>
    </>
  );
};

const loggedInButtons = (
  onLogout: () => Promise<void>,
  onShowHistory?: () => void,
  onShowPricing?: () => void,
  onShowBooks?: () => void,
  activeSection: AppBarActiveSection = "books"
) => {
  return (
    <>
      <Box className="appbar_nav_links" aria-label="Navegación principal">
        <Box
          className="appbar_brand"
          component={Link}
          href="/"
          aria-label="Ir al inicio de Teseracto"
        >
          <span className="appbar_brand_mark" aria-hidden="true" />
          <span className="appbar_brand_name">Teseracto</span>
        </Box>
        <Tooltip title="Cerrar sesión" arrow>
          <Button className="appbar_buttons" onClick={onLogout}>
            Salir
          </Button>
        </Tooltip>
      </Box>
      <Box className="appbar_actions">
        <Tooltip title="Ver libros" arrow>
          {onShowBooks ? (
            <Button
              className={`appbar_buttons ${activeSection === "books" ? "appbar_buttons_active" : ""}`}
              onClick={onShowBooks}
              aria-label="Libros"
              aria-pressed={activeSection === "books"}
            >
              <BookIcon aria-hidden="true" />
            </Button>
          ) : (
            <Button
              className={`appbar_buttons ${activeSection === "books" ? "appbar_buttons_active" : ""}`}
              href="/main"
              aria-label="Libros"
              aria-pressed={activeSection === "books"}
            >
              <BookIcon aria-hidden="true" />
            </Button>
          )}
        </Tooltip>

        <Tooltip title="Ver planes" arrow>
          {onShowPricing ? (
            <Button
              className={`appbar_buttons ${activeSection === "pricing" ? "appbar_buttons_active" : ""}`}
              onClick={onShowPricing}
              aria-label="Planes"
              aria-pressed={activeSection === "pricing"}
            >
              <StoreIcon aria-hidden="true" />
            </Button>
          ) : (
            <Button
              className={`appbar_buttons ${activeSection === "pricing" ? "appbar_buttons_active" : ""}`}
              href="/pricing"
              aria-label="Planes"
              aria-pressed={activeSection === "pricing"}
            >
              <StoreIcon aria-hidden="true" />
            </Button>
          )}
        </Tooltip>

        <Tooltip title="Abrir historial y análisis" arrow>
          <Button
            className={`appbar_buttons ${activeSection === "history" ? "appbar_buttons_active" : ""}`}
            onClick={onShowHistory}
            aria-label="Historial y análisis"
            aria-pressed={activeSection === "history"}
          >
            <InsightsIcon aria-hidden="true" />
          </Button>
        </Tooltip>
      </Box>
    </>
  );
};

export const AppBarMenu = ({
  variant = "public",
  onShowHistory,
  onShowPricing,
  onShowBooks,
  activeSection = "books",
}: AppBarMenuProps) => {
  const pathname = usePathname();
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
            <Tooltip title="Cambiar tema" arrow>
              <Button
                className="appbar_buttons appbar_theme_toggle"
                onClick={handleToggleTheme}
                aria-label="Cambiar tema"
                suppressHydrationWarning
              >
                {themeToggleIcon}
                {themeToggleLabel}
              </Button>
            </Tooltip>
          )}
          {isAuthenticated
            ? loggedInButtons(
                handleLogout,
                onShowHistory,
                onShowPricing,
                onShowBooks,
                activeSection
              )
            : notLoggedInButtons(pathname)}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

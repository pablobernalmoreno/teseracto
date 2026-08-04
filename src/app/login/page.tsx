"use client";

import { Box, Button, Divider, Link, TextField, Typography } from "@mui/material";
import React, { useState, useTransition } from "react";
import "./loginStyles.css";
import { signInAction } from "@/app/actions/auth";
import AuthPasswordField from "@/app/components/auth/AuthPasswordField";
import { loginService } from "@/features/login/model/loginService";

export interface User {
  email: string;
  password: string;
}

const initialUserState: User = {
  email: "",
  password: "",
};

function getSafeNextPath(nextPath: string | null): string | null {
  if (!nextPath) {
    return null;
  }

  const candidate = nextPath.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return null;
  }

  return candidate;
}

function getOAuthRedirectUrl(nextPath: string | null) {
  const redirectUrl = new URL("/auth/callback", globalThis.location.origin);

  if (nextPath) {
    redirectUrl.searchParams.set("next", nextPath);
  }

  return redirectUrl.toString();
}

function getServiceUnavailableHref(nextPath: string | null): string {
  const url = new URL("/auth/callback/error", globalThis.location.origin);
  url.searchParams.set("reason", "service_unavailable");

  if (nextPath) {
    url.searchParams.set("next", nextPath);
  }

  return `${url.pathname}${url.search}`;
}

function getCurrentSafeNextPath(): string | null {
  const nextPath = new URLSearchParams(globalThis.location.search).get("next");
  return getSafeNextPath(nextPath);
}

const Page = () => {
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<User>(initialUserState);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isGooglePending, setIsGooglePending] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = async () => {
    startTransition(async () => {
      const result = await signInAction(user.email, user.password);
      if (result?.success === false) {
        setErrorMessage(result.error);
      }
    });
  };

  const signInWithGoogle = async () => {
    setErrorMessage("");
    setIsGooglePending(true);

    const safeNextPath = getCurrentSafeNextPath();

    try {
      const serviceStatusResponse = await fetch("/api/auth/service-status", {
        method: "GET",
        cache: "no-store",
      });

      if (!serviceStatusResponse.ok) {
        globalThis.location.assign(getServiceUnavailableHref(safeNextPath));
        setIsGooglePending(false);
        return;
      }
    } catch {
      globalThis.location.assign(getServiceUnavailableHref(safeNextPath));
      setIsGooglePending(false);
      return;
    }

    const redirectTo = getOAuthRedirectUrl(safeNextPath);
    const { error } = await loginService.signInWithGoogle(redirectTo);

    if (error) {
      setErrorMessage("No se pudo iniciar sesión con Google. Intenta nuevamente.");
      setIsGooglePending(false);
    }
  };

  return (
    <main id="main-content" className="login_container">
      <Typography className="login_title" component="h1" variant="h4">
        Iniciar Sesión
      </Typography>
      <Box className="login_form_container">
        <form
          className="login_form"
          method="post"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
          noValidate
        >
          <Box className="auth_field_spacing_lg">
            <TextField
              fullWidth
              type="email"
              name="email"
              label="Correo electrónico"
              variant="outlined"
              required
              onChange={handleInputChange}
              value={user.email}
              error={!!errorMessage}
              aria-describedby={errorMessage ? "login-error" : undefined}
            />
          </Box>
          <Box className="auth_field_spacing_lg">
            <AuthPasswordField
              fullWidth
              name="password"
              label="Contraseña"
              variant="outlined"
              required
              onChange={handleInputChange}
              value={user.password}
              error={!!errorMessage}
              aria-describedby={errorMessage ? "login-error" : undefined}
            />
          </Box>
          {errorMessage ? (
            <Typography
              className="auth_error_message"
              id="login-error"
              role="alert"
              aria-live="assertive"
              color="error"
            >
              {errorMessage}
            </Typography>
          ) : null}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            className="get_started"
            disabled={isPending || isGooglePending}
          >
            {isPending ? "Iniciando..." : "Iniciar Sesión"}
          </Button>
          <Box className="google_signin_spacing">
            <Button
              type="button"
              variant="outlined"
              fullWidth
              className="google_signin"
              onClick={() => {
                void signInWithGoogle();
              }}
              disabled={isPending || isGooglePending}
            >
              <span className="google_mark" aria-hidden="true">
                G
              </span>
              {isGooglePending ? "Redirigiendo..." : "Iniciar con Google"}
            </Button>
          </Box>
        </form>
        <Box className="auth_divider_spacing">
          <Divider>
            <Typography variant="body2" color="textSecondary">
              O continuar con
            </Typography>
          </Divider>
        </Box>
        <Box className="auth_footer_spacing auth_text_center">
          <Typography variant="body2" color="textSecondary">
            ¿No tienes una cuenta?{" "}
            <Link href="/register" underline="hover">
              Crear cuenta
            </Link>
          </Typography>
        </Box>
      </Box>
    </main>
  );
};

export default Page;

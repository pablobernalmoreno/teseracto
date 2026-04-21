"use client";

import { Box, Button, Divider, Link, TextField, Typography } from "@mui/material";
import React, { useState, useTransition } from "react";
import "./loginStyles.css";
import { signInAction } from "@/app/actions/auth";

export interface User {
  email: string;
  password: string;
}

const initialUserState: User = {
  email: "",
  password: "",
};

const Page = () => {
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<User>(initialUserState);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = async () => {
    startTransition(async () => {
      const result = await signInAction(user.email, user.password);
      if (!result.success) {
        setErrorMessage(result.error);
      }
    });
  };

  return (
    <main id="main-content" className="login_container">
      <Typography className="login_title" component="h1" variant="h4">
        Iniciar Sesión
      </Typography>
      <Box className="login_form_container">
        <form
          className="login_form"
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
            <TextField
              fullWidth
              type="password"
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
            disabled={isPending}
          >
            {isPending ? "Iniciando..." : "Iniciar Sesión"}
          </Button>
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

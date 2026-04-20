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
          <Box mb={2}>
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
          <Box mb={2}>
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
            <Typography id="login-error" role="alert" aria-live="assertive" color="error" mb={2}>
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
        <Box my={2}>
          <Divider>
            <Typography variant="body2" color="textSecondary">
              O continuar con
            </Typography>
          </Divider>
        </Box>

        {/* <Box className="sso_buttons">
          <Button
            fullWidth
            variant="outlined"
            className="sso_button"
            startIcon={
              <Image
                src="/login/google_login.png"
                alt="Google"
                width={24}
                height={24}
              />
            }
          >
            Continuar con Google
          </Button>
          <Button
            fullWidth
            variant="outlined"
            className="sso_button"
            startIcon={
              <Image
                src="/login/facebook_login.png"
                alt="Facebook"
                width={24}
                height={24}
              />
            }
          >
            Continuar con Facebook
          </Button>
        </Box> */}
        <Box mt={2} sx={{ textAlign: "center" }}>
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

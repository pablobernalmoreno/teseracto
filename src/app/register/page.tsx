"use client";
import { Box, Button, Link, TextField, Typography } from "@mui/material";
import React, { useState, useTransition } from "react";
import "../login/loginStyles.css";
import { User } from "../login/page";
import { signUpAction } from "@/app/actions/auth";

interface NewUser extends User {
  confirm_password: string;
}

const initialNewUserState: NewUser = {
  email: "",
  password: "",
  confirm_password: "",
};

const Page = () => {
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<NewUser>(initialNewUserState);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handleSubmit = async () => {
    startTransition(async () => {
      const result = await signUpAction(user.email, user.password, user.confirm_password);
      if (!result.success) {
        setErrorMessage(result.error);
      }
    });
  };

  return (
    <main id="main-content" className="login_container">
      <Typography className="login_title" component="h1" variant="h4">
        Crear Cuenta
      </Typography>
      <Box className="register_form_container">
        <form
          className="login_form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
          noValidate
        >
          <Box className="auth_field_spacing_md">
            <TextField
              fullWidth
              type="email"
              name="email"
              label="Correo electrónico"
              variant="outlined"
              onChange={handleInputChange}
              value={user.email}
              error={!!errorMessage}
              aria-describedby={errorMessage ? "register-error" : undefined}
              required
            />
          </Box>
          <Box className="auth_field_spacing_md">
            <TextField
              fullWidth
              type="password"
              name="password"
              label="Contraseña"
              variant="outlined"
              onChange={handleInputChange}
              value={user.password}
              error={!!errorMessage}
              aria-describedby={errorMessage ? "register-error" : undefined}
              required
            />
          </Box>
          <Box className="auth_field_spacing_md">
            <TextField
              fullWidth
              type="password"
              name="confirm_password"
              label="Confirmar Contraseña"
              variant="outlined"
              onChange={handleInputChange}
              value={user.confirm_password}
              error={!!errorMessage}
              aria-describedby={errorMessage ? "register-error" : undefined}
              required
            />
          </Box>
          {errorMessage ? (
            <Typography
              className="auth_error_message"
              id="register-error"
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
            className="create_account"
            disabled={isPending}
          >
            {isPending ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>
        <Box className="auth_footer_spacing_lg auth_text_center">
          <Typography variant="body2" color="textSecondary">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" underline="hover">
              Ingresa aquí
            </Link>
          </Typography>
        </Box>
      </Box>
    </main>
  );
};

export default Page;

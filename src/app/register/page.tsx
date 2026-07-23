"use client";
import { Box, Button, Link, TextField, Typography } from "@mui/material";
import React, { useState, useTransition } from "react";
import AuthPasswordField from "@/app/components/auth/AuthPasswordField";
import "../login/loginStyles.css";
import { User } from "../login/page";
import { signUpAction } from "@/app/actions/auth";
import { loginService } from "@/features/login/model/loginService";

interface NewUser extends User {
  confirm_password: string;
}

const initialNewUserState: NewUser = {
  email: "",
  password: "",
  confirm_password: "",
};

function getOAuthRedirectUrl() {
  return new URL("/auth/callback", globalThis.location.origin).toString();
}

const Page = () => {
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<NewUser>(initialNewUserState);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isGooglePending, setIsGooglePending] = useState(false);

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

  const signInWithGoogle = async () => {
    setErrorMessage("");
    setIsGooglePending(true);

    const redirectTo = getOAuthRedirectUrl();
    const { error } = await loginService.signInWithGoogle(redirectTo);

    if (error) {
      setErrorMessage("No se pudo iniciar sesión con Google. Intenta nuevamente.");
      setIsGooglePending(false);
    }
  };

  return (
    <main id="main-content" className="login_container">
      <Typography className="login_title" component="h1" variant="h4">
        Crear Cuenta
      </Typography>
      <Box className="register_form_container">
        <form
          className="login_form"
          method="post"
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
            <AuthPasswordField
              fullWidth
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
            <AuthPasswordField
              fullWidth
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
            disabled={isPending || isGooglePending}
          >
            {isPending ? "Creando cuenta..." : "Crear cuenta"}
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

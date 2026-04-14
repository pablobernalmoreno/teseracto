"use client";
import { Box, Button, Link, Typography, TextField } from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import React, { useEffect, useState, useTransition } from "react";
import "../login/loginStyles.css";
import styles from "./page.module.css";
import { resendConfirmationEmailAction } from "@/app/actions/auth";

const Page = () => {
  const [isPending, startTransition] = useTransition();
  const [resendEmail, setResendEmail] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const isResendDisabled = timeLeft > 0 || isPending;

  const resendConfirmationEmail = async () => {
    if (!resendEmail.trim()) return;

    startTransition(async () => {
      const result = await resendConfirmationEmailAction(resendEmail);
      if (result.success) {
        setTimeLeft(60);
        setSuccessMessage("Email reenviado correctamente");
        setErrorMessage("");
      } else {
        setErrorMessage(result.error || "Error al reenviar el email");
      }
    });
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  return (
    <main id="main-content" className="login_container">
      <Box className="account_confirmation_form_container">
        <MarkEmailReadIcon aria-hidden="true" className={styles.confirmationIcon} />
        <Typography className="account_confirmation_title" component="h1" variant="h4">
          Confirmación de Cuenta
        </Typography>
        <Typography className="account_confirmation_subtitle" variant="h6">
          Hemos enviado un email de confirmación para verificar tu cuenta. Por favor, revisa tu
          bandeja de entrada y sigue las instrucciones proporcionadas. Una vez que hayas confirmado
          tu cuenta, podrás{" "}
          <Link href="/login" underline="hover">
            iniciar sesión
          </Link>
          .
        </Typography>
      </Box>
      <Box textAlign="center">
        <Typography variant="body2" color="textSecondary" mb={2}>
          ¿No te llegó el correo?
        </Typography>
        {successMessage && (
          <Typography color="success" mb={2}>
            {successMessage}
          </Typography>
        )}
        {errorMessage && (
          <Typography color="error" mb={2}>
            {errorMessage}
          </Typography>
        )}
        <Box mb={2}>
          <TextField
            size="small"
            type="email"
            label="Ingresa tu email"
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            variant="outlined"
          />
        </Box>
        <Button
          onClick={resendConfirmationEmail}
          disabled={isResendDisabled || !resendEmail.trim()}
          variant="contained"
          className="auth_secondary_action"
        >
          {isResendDisabled ? `Reenviar en ${timeLeft}s` : "Reenviar correo"}
        </Button>
      </Box>
    </main>
  );
};

export default Page;

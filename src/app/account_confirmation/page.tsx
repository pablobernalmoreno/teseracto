"use client";
import { Box, Button, Link, Typography, TextField } from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import React, { useEffect, useState } from "react";
import "../login/loginStyles.css";
import { accountConfirmationService } from "@/modules/account_confirmation/model/accountConfirmationService";

const Page = () => {
  const [resendEmail, setResendEmail] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const isResendDisabled = timeLeft > 0;

  const resendConfirmationEmail = async () => {
    if (!resendEmail.trim()) return;
    const result = await accountConfirmationService.resendConfirmationEmail(resendEmail);
    if (result.success) {
      setTimeLeft(60);
    }
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
    <div className="login_container">
      <Box className="account_confirmation_form_container">
        <MarkEmailReadIcon style={{ fontSize: 200, color: "#4caf50" }} />
        <Typography className="account_confirmation_title" variant="h4">
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
        >
          {isResendDisabled ? `Reenviar en ${timeLeft}s` : "Reenviar correo"}
        </Button>
      </Box>
    </div>
  );
};

export default Page;

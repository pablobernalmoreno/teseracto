"use client";
import { Box, Button, Link, Typography } from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import React, { useEffect, useState } from "react";
import "../login/loginStyles.css";
import { accountConfirmationService } from "@/modules/account_confirmation/model/accountConfirmationService";

const page = () => {
  const [registeredEmail, setRegisteredEmail] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isResendDisabled, setIsResendDisabled] = useState<boolean>(true);

  useEffect(() => {
    const decryptAndSetEmail = async () => {
      const email = await accountConfirmationService.decryptRegisteredEmail();
      if (email) {
        setRegisteredEmail(email);
      }
    };
    decryptAndSetEmail();
  }, []);

  const resendConfirmationEmail = async () => {
    const result = await accountConfirmationService.resendConfirmationEmail(
      registeredEmail
    );
    if (result.success) {
      setTimeLeft(60);
      setIsResendDisabled(true);
    }
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timerId);
    } else {
      setIsResendDisabled(false);
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
          Hemos enviado un email a {registeredEmail} para confirmar tu cuenta.
          Por favor, revisa tu bandeja de entrada y sigue las instrucciones
          proporcionadas. Una vez que hayas confirmado tu cuenta, podrás{" "}
          <Link href="/login" underline="hover">
            iniciar sesión
          </Link>
          .
        </Typography>
      </Box>
      <Box textAlign="center">
        <Typography variant="body2" color="textSecondary">
          ¿No te llegó el correo?
          <Button onClick={resendConfirmationEmail} disabled={isResendDisabled}>
            {isResendDisabled ? `Reenviar en ${timeLeft}s` : "Reenviar correo"}
          </Button>
        </Typography>
      </Box>
    </div>
  );
};

export default page;

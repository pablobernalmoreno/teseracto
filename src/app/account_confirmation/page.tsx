"use client";
import { Box, Button, Typography } from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import React, { useEffect, useState } from "react";
import "../login/loginStyles.css";
import { decryptData } from "../utils/crypto";

const page = () => {
  const [registeredEmail, setRegisteredEmail] = useState<string>("");

  const decryptAndSetEmail = async () => {
    // Move sessionStorage access inside useEffect to ensure it's only called in the browser
    if (typeof window !== 'undefined') {
      const encryptedEmail = sessionStorage.getItem("registered_email");
      const emailIv = sessionStorage.getItem("email_iv");
      
      if (encryptedEmail && emailIv) {
        try {
          const email = await decryptData(encryptedEmail, emailIv);
          setRegisteredEmail(email);
        } catch (error) {
          console.error('Error decrypting email:', error);
        }
      }
    }
  };

  useEffect(() => {
    decryptAndSetEmail();
  }, []);

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
          proporcionadas.
        </Typography>
      </Box>
      <Box textAlign="center">
        <Typography variant="body2" color="textSecondary">
          ¿No te llegó el correo?
          <Button>Reenvialo aqui</Button>
        </Typography>
      </Box>
    </div>
  );
};

export default page;

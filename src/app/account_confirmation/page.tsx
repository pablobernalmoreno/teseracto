"use client";
import { Box, Button, Typography } from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import React from "react";
import "../login/loginStyles.css";

const page = () => {


  return (
    <div className="login_container">
      <Box className="account_confirmation_form_container">
        <MarkEmailReadIcon style={{ fontSize: 200, color: "#4caf50" }} />
        <Typography className="account_confirmation_title" variant="h4">
          Confirmación de Cuenta
        </Typography>
        <Typography className="account_confirmation_subtitle" variant="h6">
          Hemos enviado un email a para confirmar tu cuenta. Por favor, revisa
          tu bandeja de entrada y sigue las instrucciones proporcionadas.
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

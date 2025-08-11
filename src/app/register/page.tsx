"use client";
import { Box, Button, Link, TextField, Typography } from "@mui/material";
import React from "react";
import "../login/loginStyles.css";

const page = () => {
  return (
    <div className="login_container">
      <Typography className="login_title" variant="h4">
        Iniciar Sesión
      </Typography>
      <Box className="register_form_container">
        <form className="login_form">
          <Box mb={2}>
            <TextField
              fullWidth
              type="email"
              name="email"
              label="Correo electrónico"
              variant="outlined"
              required
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
            />
          </Box>
          <Box mb={2}>
            <TextField
              fullWidth
              type="password"
              name="confirm_password"
              label="Confirmar Contraseña"
              variant="outlined"
              required
            />
          </Box>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            className="create_account"
          >
            Crear cuenta
          </Button>
        </form>
        <Box mt={8} textAlign="center">
          <Typography variant="body2" color="textSecondary">
            ¿Ya tienes cuenta?
            <Link href="/login" underline="hover">
              Ingresa aquí
            </Link>
          </Typography>
        </Box>
      </Box>
    </div>
  );
};

export default page;

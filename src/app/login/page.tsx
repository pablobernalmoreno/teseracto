"use client";
import { Box, Divider, Typography } from "@mui/material";
import React from "react";
import "./loginStyles.css";
import Image from "next/image";

const page = () => {
  return (
    <div className="login_container">
      <Typography className="login_title" variant="h4">
        Iniciar Sesión
      </Typography>
      <Box className="login_form_container">
        <form className="login_form">
          <Box mb={2}>
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              className="login_input"
              required
            />
          </Box>
          <Box mb={2}>
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              className="login_input"
              required
            />
          </Box>
          <button type="submit" className="login_button">
            Iniciar Sesión
          </button>
        </form>
        <Box my={2}>
          <Divider>
            <Typography variant="body2" color="textSecondary">
              O continuar con
            </Typography>
          </Divider>
        </Box>

        <Box className="sso_buttons">
          <button className="sso_button google_button">
            <Image src="/login/google_login.png" alt="Google" width={50} height={50}/>
            Continuar con Google
          </button>
          <button className="sso_button facebook_button">
            <Image src="/login/facebook_login.png" alt="Facebook" width={50} height={50}/>
            Continuar con Facebook
          </button>
        </Box>
      </Box>
    </div>
  );
};

export default page;

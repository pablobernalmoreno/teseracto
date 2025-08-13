"use client";
import {
  Box,
  Button,
  Divider,
  Link,
  TextField,
  Typography,
} from "@mui/material";
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
          <Button
            type="submit"
            variant="contained"
            fullWidth
            className="get_started"
            href="/main"
          >
            Iniciar Sesión
          </Button>
        </form>
        <Box my={2}>
          <Divider>
            <Typography variant="body2" color="textSecondary">
              O continuar con
            </Typography>
          </Divider>
        </Box>

        <Box className="sso_buttons">
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
        </Box>
        <Box mt={2} textAlign="center">
          <Typography variant="body2" color="textSecondary">
            ¿No tienes una cuenta?
            <Link href="/register" underline="hover">
              Crear cuenta
            </Link>
          </Typography>
        </Box>
      </Box>
    </div>
  );
};

export default page;

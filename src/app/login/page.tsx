"use client";
import {
  Box,
  Button,
  Divider,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import "./loginStyles.css";
import Image from "next/image";
import supabase from "@/config/supabaseClient";
import { redirect } from "next/navigation";

export interface User {
  email: string;
  password: string;
}

const initialUserState: User = {
  email: "",
  password: "",
};

const errorMessageInitialState: string = "";

const page = () => {
  const [user, setUser] = useState<User>(initialUserState);
  const [errorMessage, setErrorMessage] = useState<string>(errorMessageInitialState);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ user });

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });
    if (error) {
      setErrorMessage(error.message);
    } else {
      setErrorMessage(errorMessageInitialState);
      redirect("/main");
    }
  };

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
              onChange={handleInputChange}
              error={!!errorMessage}
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
              onChange={handleInputChange}
              error={!!errorMessage}
              helperText={errorMessage}
            />
          </Box>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            className="get_started"
            onClick={onSubmit}
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

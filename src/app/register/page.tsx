"use client";
import { Box, Button, Link, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import "../login/loginStyles.css";
import { User } from "../login/page";
import { loginService } from "@/modules/login/model/loginService";

interface NewUser extends User {
  confirm_password: string;
}

const initialNewUserState: NewUser = {
  email: "",
  password: "",
  confirm_password: "",
};

const page = () => {
  const [user, setUser] = useState<NewUser>(initialNewUserState);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginService.validatePassword(user.password, user.confirm_password)) {
      setErrorMessage("Las contraseñas no coinciden");
      return;
    }

    setErrorMessage("");
    const result = await loginService.signUp({
      email: user.email,
      password: user.password,
      confirm_password: user.confirm_password,
    });

    if (result.error) {
      setErrorMessage(result.error.message);
    } else {
      setErrorMessage("");
      window.location.href = "/account_confirmation";
    }
  };

  return (
    <div className="login_container">
      <Typography className="login_title" variant="h4">
        Crear Cuenta
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
              onChange={handleInputChange}
              error={!!errorMessage}
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
              onChange={handleInputChange}
              error={!!errorMessage}
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
              onChange={handleInputChange}
              error={!!errorMessage}
              helperText={errorMessage}
              required
            />
          </Box>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            className="create_account"
            onClick={onSubmit}
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

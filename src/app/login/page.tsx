"use client";
import { Box, Button, Divider, Link, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import "./loginStyles.css";
import supabase from "@/config/supabaseClient";
import { useRouter } from "next/navigation";

export interface User {
  email: string;
  password: string;
}

const initialUserState: User = {
  email: "",
  password: "",
};

const errorMessageInitialState: string = "";

const Page = () => {
  const router = useRouter();
  const [user, setUser] = useState<User>(initialUserState);
  const [errorMessage, setErrorMessage] = useState<string>(errorMessageInitialState);

  const rollbackClientSession = async () => {
    await supabase.auth.signOut();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      const accessToken = data?.session?.access_token;
      const refreshToken = data?.session?.refresh_token;

      if (!accessToken || !refreshToken) {
        await rollbackClientSession();
        setErrorMessage("No se pudo sincronizar la sesion. Intentalo nuevamente.");
        return;
      }

      try {
        const syncResponse = await fetch("/api/auth/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
          }),
        });

        if (!syncResponse.ok) {
          await rollbackClientSession();
          const payload = (await syncResponse.json().catch(() => null)) as {
            error?: string;
          } | null;
          setErrorMessage(payload?.error || "No se pudo iniciar la sesión.");
          return;
        }
      } catch {
        await rollbackClientSession();
        setErrorMessage("No se pudo sincronizar la sesion. Verifica tu conexion.");
        return;
      }

      setErrorMessage(errorMessageInitialState);
      router.replace("/main");
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

        {/* <Box className="sso_buttons">
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
        </Box> */}
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

export default Page;

"use client";

import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { IconButton, InputAdornment, TextField, type TextFieldProps } from "@mui/material";
import React, { useState } from "react";

type AuthPasswordFieldProps = Omit<TextFieldProps, "type">;

export default function AuthPasswordField(props: AuthPasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField
      {...props}
      type={showPassword ? "text" : "password"}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                edge="end"
                onClick={() => {
                  setShowPassword((currentValue) => !currentValue);
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
              >
                {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

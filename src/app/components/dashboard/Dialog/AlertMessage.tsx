import React from "react";
import { Alert, AlertColor, Snackbar } from "@mui/material";

interface AlertMessageProps {
  open: boolean;
  message: string;
  severity: AlertColor;
  onClose: () => void;
}

const AlertMessage = ({ open, message, severity, onClose }: AlertMessageProps) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3500}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert onClose={onClose} severity={severity} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AlertMessage;
import { Suspense } from "react";
import { Box, Button, Typography } from "@mui/material";
import "../../../login/loginStyles.css";
import OAuthCallbackErrorContent from "./OAuthCallbackErrorContent";

function OAuthCallbackErrorFallback() {
  return (
    <main id="main-content" className="login_container">
      <Typography className="login_title" component="h1" variant="h4">
        Error de autenticación
      </Typography>
      <Box className="login_form_container auth_text_center" sx={{ gap: 2, display: "grid" }}>
        <Typography variant="body1" color="textSecondary">
          Ocurrió un error durante la autenticación.
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Intenta iniciar sesión nuevamente o vuelve al inicio.
        </Typography>
        <Button href="/login" variant="contained" fullWidth className="auth_primary_action">
          Reintentar inicio de sesión
        </Button>
        <Button href="/" variant="outlined" fullWidth className="auth_outline_action">
          Ir al inicio
        </Button>
      </Box>
    </main>
  );
}

export default function OAuthCallbackErrorPage() {
  return (
    <Suspense fallback={<OAuthCallbackErrorFallback />}>
      <OAuthCallbackErrorContent />
    </Suspense>
  );
}

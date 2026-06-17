import { Suspense } from "react";
import { Box, Button, Typography } from "@mui/material";

const callbackErrorMessages: Record<string, string> = {
  missing_code: "No recibimos el código de autenticación de Google.",
  oauth_callback: "No se pudo completar el inicio de sesión con Google.",
};

type OAuthCallbackErrorPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function OAuthCallbackErrorMessage({ searchParams }: OAuthCallbackErrorPageProps) {
  const resolvedSearchParams = await searchParams;
  const reason =
    typeof resolvedSearchParams.reason === "string"
      ? resolvedSearchParams.reason
      : "oauth_callback";
  const message =
    callbackErrorMessages[reason] ?? "Ocurrió un error inesperado durante la autenticación.";

  return (
    <Typography variant="body1" color="textSecondary">
      {message}
    </Typography>
  );
}

export default function OAuthCallbackErrorPage({ searchParams }: OAuthCallbackErrorPageProps) {
  return (
    <main id="main-content" className="login_container">
      <Typography className="login_title" component="h1" variant="h4">
        Error de autenticación
      </Typography>
      <Box className="login_form_container auth_text_center" sx={{ gap: 2, display: "grid" }}>
        <Suspense
          fallback={
            <Typography variant="body1" color="textSecondary">
              Ocurrió un error durante la autenticación.
            </Typography>
          }
        >
          <OAuthCallbackErrorMessage searchParams={searchParams} />
        </Suspense>
        <Typography variant="body2" color="textSecondary">
          Intenta iniciar sesión nuevamente o vuelve al inicio.
        </Typography>
        <Button href="/login" variant="contained" fullWidth>
          Volver a iniciar sesión
        </Button>
        <Button href="/" variant="outlined" fullWidth>
          Ir al inicio
        </Button>
      </Box>
    </main>
  );
}

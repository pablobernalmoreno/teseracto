import { Box, Button, Typography } from "@mui/material";
import "../../../login/loginStyles.css";
import { getSafeAuthRedirectPath } from "../redirect";

const callbackErrorMessages: Record<string, string> = {
  missing_code: "No recibimos el código de autenticación de Google.",
  oauth_callback: "No se pudo completar el inicio de sesión con Google.",
  service_unavailable:
    "El servicio de autenticación está temporalmente no disponible. Intenta nuevamente en unos minutos.",
};

function getErrorTitle(reason: string): string {
  if (reason === "service_unavailable") {
    return "Servicio temporalmente no disponible";
  }

  return "Error de autenticación";
}

type OAuthCallbackErrorPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getRetryLoginHref(nextPath: string): string {
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export default async function OAuthCallbackErrorPage({
  searchParams,
}: Readonly<OAuthCallbackErrorPageProps>) {
  const params = await searchParams;
  const reason = typeof params.reason === "string" ? params.reason : "oauth_callback";
  const rawNextPath = typeof params.next === "string" ? params.next : null;
  const nextPath = getSafeAuthRedirectPath(rawNextPath);
  const message =
    callbackErrorMessages[reason] ?? "Ocurrió un error inesperado durante la autenticación.";
  const retryLabel =
    reason === "service_unavailable" ? "Reintentar con Google" : "Reintentar inicio de sesión";
  const helperText =
    reason === "service_unavailable"
      ? "El sistema puede tardar unos minutos en estar disponible otra vez."
      : "Intenta iniciar sesión nuevamente o vuelve al inicio.";

  return (
    <main id="main-content" className="login_container">
      <Typography className="login_title" component="h1" variant="h4">
        {getErrorTitle(reason)}
      </Typography>
      <Box className="login_form_container auth_text_center" sx={{ gap: 2, display: "grid" }}>
        <Typography
          variant="body1"
          color="textSecondary"
          className={reason === "service_unavailable" ? "auth_unavailable_message" : undefined}
        >
          {message}
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          className={reason === "service_unavailable" ? "auth_unavailable_helper" : undefined}
        >
          {helperText}
        </Typography>
        <Button
          href={getRetryLoginHref(nextPath)}
          variant="contained"
          fullWidth
          className="auth_primary_action"
        >
          {retryLabel}
        </Button>
        <Button href="/" variant="outlined" fullWidth className="auth_outline_action">
          Ir al inicio
        </Button>
      </Box>
    </main>
  );
}

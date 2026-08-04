import { Box, Button, Typography } from "@mui/material";
import "./not-found.css";

const HOME_PATH = "/";

export default function NotFound() {
  return (
    <main id="main-content" className="not_found_root">
      <Box className="not_found_card">
        <Typography className="not_found_code" component="p">
          404
        </Typography>
        <Typography className="not_found_title" component="h1" variant="h3">
          Esta pagina no existe
        </Typography>
        <Typography className="not_found_message" variant="body1">
          La ruta que intentaste abrir no fue encontrada. Revisa la URL o vuelve al inicio de
          Teseracto.
        </Typography>
        <Button className="not_found_button" href={HOME_PATH} variant="contained" size="large">
          Volver al inicio
        </Button>
      </Box>
    </main>
  );
}

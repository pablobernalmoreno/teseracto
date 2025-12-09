import { AppBarMenu } from "./components/appBarMenu/AppBarMenu";
import { Box, Button, Typography } from "@mui/material";
import "./page.css";

export default function Home() {
  return (
    <>
      <AppBarMenu />
      <Box className="main_box">
        <section>
          <Typography className="title" variant="h3">
            Titulo!
          </Typography>
          <Typography variant="h6" className="description">
            Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui
            lorem cupidatat commodo. Elit sunt amet fugiat veniam occaecat.
          </Typography>
          <Box className="main_buttons_container">
            <Button className="get_started" variant="contained">
              Empecemos
            </Button>
            <Button className="more_info">Más info</Button>
          </Box>
        </section>
      </Box>
    </>
  );
}

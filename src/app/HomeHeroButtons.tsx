"use client";

import { Button, Box } from "@mui/material";
import Link from "next/link";

export const HomeHeroButtons = () => {
  return (
    <Box className="main_buttons_container">
      <Button className="get_started" variant="contained" component={Link} href="/register">
        Crear cuenta
      </Button>
      <Button className="more_info" component={Link} href="/login">
        Ya tengo cuenta
      </Button>
    </Box>
  );
};

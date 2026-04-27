import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AppBarMenu } from "../components/appBarMenu/AppBarMenu";
import { Box, Button, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import "./pricingStyles.css";

export const metadata: Metadata = {
  title: "Precios",
  description: "Conoce los planes de Teseracto para gestionar tu biblioteca financiera.",
  alternates: {
    canonical: "/pricing",
  },
};

const features = [
  "Libros ilimitados",
  "Movimientos y registros sin límite",
  "Panel de estadísticas",
  "Exportación de datos",
  "Soporte por correo",
];

const page = () => {
  return (
    <>
      <AppBarMenu />
      <Box component="main" id="main-content" className="pricing_box">
        <section className="pricing_hero">
          <Typography className="pricing_eyebrow" component="p">
            Sin sorpresas
          </Typography>
          <Typography className="pricing_title" component="h1">
            Un precio simple,
            <br />
            <span className="pricing_title_accent">todo incluido.</span>
          </Typography>
          <Typography className="pricing_subtitle">
            Accede a todas las funciones de Teseracto con cualquiera de los planes. Sin niveles, sin
            restricciones ocultas.
          </Typography>
        </section>

        <section className="pricing_cards" aria-label="Planes disponibles">
          <Box className="pricing_card">
            <Typography className="pricing_card_label" component="p">
              Mensual
            </Typography>
            <Typography className="pricing_card_price" component="p">
              $10.000 <span className="pricing_card_period">/ mes</span>
            </Typography>
            <Typography className="pricing_card_desc">
              Ideal para probar Teseracto sin compromisos. Cancela cuando quieras.
            </Typography>
            <ul className="pricing_features_list">
              {features.map((f) => (
                <li key={f} className="pricing_feature_item">
                  <CheckIcon className="pricing_check_icon" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/register" style={{ width: "100%" }}>
              <Button className="pricing_btn_secondary" fullWidth>
                Únete
              </Button>
            </Link>
          </Box>

          <Box className="pricing_card pricing_card_featured">
            <Box className="pricing_card_badge">Mejor valor</Box>
            <Typography className="pricing_card_label" component="p">
              Anual
            </Typography>
            <Typography className="pricing_card_price" component="p">
              $100.000 <span className="pricing_card_period">/ año</span>
            </Typography>
            <Typography className="pricing_card_desc">
              El plan más completo para quienes usan Teseracto de forma continua. Ahorra 2 meses.
            </Typography>
            <ul className="pricing_features_list">
              {features.map((f) => (
                <li key={f} className="pricing_feature_item">
                  <CheckIcon className="pricing_check_icon" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/register" style={{ width: "100%" }}>
              <Button className="pricing_btn_primary" fullWidth>
                Únete
              </Button>
            </Link>
          </Box>
        </section>
      </Box>
    </>
  );
};

export default page;

import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AppBarMenu } from "../components/appBarMenu/AppBarMenu";
import { createClient } from "@/app/utils/supabase/server";
import { Box, Button, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { comparisonRows, plans } from "./pricingData";
import "./pricingStyles.css";

export const metadata: Metadata = {
  title: "  Planes",
  description: "Conoce los planes de Teseracto para gestionar tu biblioteca financiera.",
  alternates: {
    canonical: "/pricing",
  },
};

const page = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const appBarVariant = user?.id ? "authenticated" : "public";

  return (
    <>
      <AppBarMenu variant={appBarVariant} />
      <Box component="main" id="main-content" className="pricing_box">
        <section className="pricing_hero">
          <Typography className="pricing_eyebrow" component="p">
            Sin sorpresas
          </Typography>
          <Typography className="pricing_title" component="h1">
            Empieza gratis,
            <br />
            <span className="pricing_title_accent">escala cuando lo necesites.</span>
          </Typography>
          <Typography className="pricing_subtitle">
            El plan gratis te deja trabajar con hasta 10 libros y leer imágenes con un cupo mensual.
            Los planes Pro desbloquean más capacidad, exportación y análisis avanzados.
          </Typography>
        </section>

        <section className="pricing_cards" aria-label="Planes disponibles">
          {plans.map((plan) => (
            <Box
              key={plan.name}
              className={plan.featured ? "pricing_card pricing_card_featured" : "pricing_card"}
            >
              {plan.badge ? <Box className="pricing_card_badge">{plan.badge}</Box> : null}
              <Typography className="pricing_card_label" component="p">
                {plan.name}
              </Typography>
              <Typography className="pricing_card_price" component="p">
                {plan.price} <span className="pricing_card_period">{plan.period}</span>
              </Typography>
              <Typography className="pricing_card_desc">{plan.description}</Typography>
              <ul className="pricing_features_list">
                {plan.features.map((feature) => (
                  <li key={feature} className="pricing_feature_item">
                    <CheckIcon className="pricing_check_icon" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href={plan.href} style={{ width: "100%" }}>
                <Button className={plan.ctaClassName} fullWidth>
                  {plan.ctaLabel}
                </Button>
              </Link>
            </Box>
          ))}
        </section>

        <section className="pricing_matrix" aria-label="Comparación de funciones">
          <Typography className="pricing_section_title" component="h2" variant="h5">
            Comparación rápida
          </Typography>
          <table className="pricing_matrix_table" aria-label="Tabla de comparación">
            <thead>
              <tr className="pricing_matrix_row pricing_matrix_row_header">
                <th className="pricing_matrix_cell pricing_matrix_feature" scope="col">
                  Función
                </th>
                <th className="pricing_matrix_cell" scope="col">
                  Gratis
                </th>
                <th className="pricing_matrix_cell" scope="col">
                  Pro
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label} className="pricing_matrix_row">
                  <th className="pricing_matrix_cell pricing_matrix_feature" scope="row">
                    {row.label}
                  </th>
                  <td className="pricing_matrix_cell">{row.free}</td>
                  <td className="pricing_matrix_cell">{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Typography className="pricing_matrix_note">
            Recomendación inicial: mantén el plan gratis mientras validas adopción, y pasa a Pro en
            cuanto tengas clientes activos que dependan del sistema o necesites respaldo y mayor
            estabilidad operativa.
          </Typography>
        </section>
      </Box>
    </>
  );
};

export default page;

"use client";

import React from "react";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import Link from "next/link";
import { comparisonRows, plans } from "@/app/pricing/pricingData";

interface DashboardPricingViewProps {
  onBack: () => void;
}

export const DashboardPricingView: React.FC<DashboardPricingViewProps> = ({ onBack }) => {
  return (
    <Box className="dashboard_pricing_view pricing_box">
      <section className="pricing_hero">
        <Box className="dashboard_pricing_heading">
          <Button
            className="appbar_buttons"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            aria-label="Volver al tablero"
          >
            Volver
          </Button>
          <Typography variant="h5" component="h2" className="pricing_section_title">
            Planes de Teseracto
          </Typography>
        </Box>
        <Typography className="pricing_subtitle">
          Elige el plan que mejor se adapte al ritmo de tu equipo y escala cuando lo necesites.
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
            <Button component={Link} href={plan.href} className={plan.ctaClassName} fullWidth>
              {plan.ctaLabel}
            </Button>
          </Box>
        ))}
      </section>

      <section className="pricing_matrix">
        <Typography className="pricing_section_title" component="h3" variant="h6">
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
      </section>
    </Box>
  );
};

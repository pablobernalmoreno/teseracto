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

const plans = [
  {
    name: "Gratis",
    price: "$0",
    period: "/ mes",
    description:
      "Para personas y equipos pequeños que quieren probar Teseracto con datos reales sin pagar al inicio.",
    ctaLabel: "Comenzar gratis",
    ctaClassName: "pricing_btn_secondary",
    href: "/register",
    features: [
      "Hasta 10 libros",
      "Hasta 100 movimientos por libro",
      "Panel básico de estadísticas",
      "Lectura automática de imágenes con cupo mensual limitado",
      "Carga de imágenes",
    ],
  },
  {
    name: "Pro mensual",
    price: "$19.900",
    period: "/ mes",
    description:
      "Para organizaciones que ya operan cada semana y necesitan más capacidad, control y exportación.",
    ctaLabel: "Elegir mensual",
    ctaClassName: "pricing_btn_secondary",
    href: "/register",
    features: [
      "Libros ilimitados",
      "Hasta 500 movimientos por libro",
      "Lectura automática ampliada para uso frecuente",
      "Historial y análisis completos",
      "Exportación a PDF y soporte por correo",
    ],
  },
  {
    name: "Pro anual",
    price: "$199.000",
    period: "/ año",
    description:
      "La mejor opción si Teseracto ya hace parte de tu operación. Equivale a 10 meses y usas 12.",
    ctaLabel: "Elegir anual",
    ctaClassName: "pricing_btn_primary",
    href: "/register",
    badge: "Mejor valor",
    featured: true,
    features: [
      "Todo lo del plan Pro",
      "Ahorro frente al pago mensual",
      "Prioridad para mejoras y soporte",
      "Más margen para crecer sin cambiar de plan",
      "Ideal para uso continuo durante todo el año",
    ],
  },
];

const comparisonRows = [
  {
    label: "Libros",
    free: "10",
    pro: "Ilimitados",
  },
  {
    label: "Movimientos por libro",
    free: "100",
    pro: "500",
  },
  {
    label: "Lectura automática de comprobantes",
    free: "Incluido con cupo mensual",
    pro: "Cupo ampliado",
  },
  {
    label: "Panel y métricas",
    free: "Básico",
    pro: "Completo",
  },
  {
    label: "Exportación PDF",
    free: "No incluida",
    pro: "Incluida",
  },
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
            Empieza gratis,
            <br />
            <span className="pricing_title_accent">escala cuando lo necesites.</span>
          </Typography>
          <Typography className="pricing_subtitle">
            El plan gratis te deja trabajar con hasta 10 libros y leer imágenes con un cupo
            mensual. Los planes Pro desbloquean más capacidad, exportación y análisis avanzados.
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

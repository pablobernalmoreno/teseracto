import type { Metadata } from "next";
import { AppBarMenu } from "./components/appBarMenu/AppBarMenu";
import { HomeHeroButtons } from "./HomeHeroButtons";
import { Box, Typography } from "@mui/material";
import "./page.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "Organiza tus libros financieros, registra movimientos y visualiza patrones de forma simple con Teseracto.",
  alternates: {
    canonical: "/",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Teseracto",
  url: siteUrl,
};

function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replaceAll("<", String.raw`\u003c`)
    .replaceAll(">", String.raw`\u003e`)
    .replaceAll("&", String.raw`\u0026`)
    .replaceAll("\u2028", String.raw`\u2028`)
    .replaceAll("\u2029", String.raw`\u2029`);
}

export default function Home() {
  return (
    <>
      <script
        id="organization-json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }}
      />
      <AppBarMenu />
      <Box component="main" id="main-content" className="main_box">
        <section className="hero_section">
          <Typography className="title" component="h1" variant="h2">
            Tu biblioteca financiera, clara y viva.
          </Typography>
          <Typography variant="h6" className="description">
            Organiza ingresos, registra movimientos y descubre patrones sin hojas de cálculo
            infinitas. Diseñado para leer tus números como una historia.
          </Typography>
          <HomeHeroButtons />
          <Box className="hero_metrics" aria-label="Indicadores principales de la plataforma">
            <article className="hero_metric_card">
              <Typography className="hero_metric_value">3 min</Typography>
              <Typography className="hero_metric_label">para cargar tu primer libro</Typography>
            </article>
            <article className="hero_metric_card">
              <Typography className="hero_metric_value">100%</Typography>
              <Typography className="hero_metric_label">enfocado en claridad visual</Typography>
            </article>
            <article className="hero_metric_card">
              <Typography className="hero_metric_value">24/7</Typography>
              <Typography className="hero_metric_label">
                acceso desde cualquier dispositivo
              </Typography>
            </article>
          </Box>
        </section>
      </Box>
    </>
  );
}

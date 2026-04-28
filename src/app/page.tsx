import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import { AppBarMenu } from "./components/appBarMenu/AppBarMenu";
import { Box, Typography } from "@mui/material";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
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

async function OrganizationJsonLdScript() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <script
      id="organization-json-ld"
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }}
    />
  );
}

export default function Home() {
  return (
    <>
      <Suspense fallback={null}>
        <OrganizationJsonLdScript />
      </Suspense>
      <AppBarMenu />
      <Box component="main" id="main-content" className="main_box">
        <section className="hero_section">
          <Box className="hero_text_block">
            <Typography className="title" component="h1" variant="h2">
              Lecciones e insights
              <br />
              <span className="title_accent">de tus finanzas en minutos</span>
            </Typography>
            <Typography variant="h6" className="description">
              Crea libros, registra movimientos y visualiza patrones de forma limpia. Todo en una
              experiencia ligera, clara y pensada para equipos modernos.
            </Typography>
          </Box>
          <Box className="hero_visual" aria-hidden="true">
            <article className="visual_panel visual_panel_main">
              <span className="visual_chip">+12.5%</span>
              <span className="visual_line" />
              <span className="visual_line visual_line_short" />
              <span className="visual_line" />
            </article>
            <article className="visual_panel visual_panel_side" />
            <article className="visual_circle" />
          </Box>
        </section>

        <section className="segments_section" aria-label="Tipos de organizaciones">
          <Typography className="section_title" component="h2" variant="h4">
            Gestiona toda tu comunidad
          </Typography>
          <Typography className="section_subtitle">en un sistema simple y potente</Typography>
          <Box className="segment_cards">
            <article className="segment_card">
              <Groups2OutlinedIcon className="segment_icon" />
              <Typography component="h3" className="segment_title">
                Organizaciones
                <br />
                comunitarias
              </Typography>
              <Typography className="segment_text">
                Consolida movimientos y reportes con un panel operativo central.
              </Typography>
            </article>
            <article className="segment_card">
              <ApartmentOutlinedIcon className="segment_icon" />
              <Typography component="h3" className="segment_title">
                Asociaciones
                <br />
                nacionales
              </Typography>
              <Typography className="segment_text">
                Estandariza el seguimiento por regiones y comparte métricas clave.
              </Typography>
            </article>
            <article className="segment_card">
              <HubOutlinedIcon className="segment_icon" />
              <Typography component="h3" className="segment_title">
                Grupos y clubes
                <br />
                locales
              </Typography>
              <Typography className="segment_text">
                Visualiza desempeño y detecta cambios en el momento correcto.
              </Typography>
            </article>
          </Box>
        </section>
      </Box>
    </>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const siteName = "Teseracto";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: `${siteName} | Tus cuentas claras`,
    template: `%s | ${siteName}`,
  },
  description:
    "Teseracto te ayuda a organizar tus planillas, registrar movimientos y ver con claridad cómo se mueve tu plata.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${siteName} | Tus cuentas claras`,
    description: "Organiza tus ingresos y revisa tus planillas de forma clara, ágil y sin enredos.",
    url: "/",
    siteName,
    locale: "es_CO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Tus cuentas claras`,
    description:
      "Organiza movimientos, revisa planillas y entiende tus finanzas sin complicaciones.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}

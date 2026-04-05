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
    default: `${siteName} | Biblioteca Financiera`,
    template: `%s | ${siteName}`,
  },
  description:
    "Teseracto te ayuda a organizar libros financieros, registrar movimientos y entender patrones con claridad.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${siteName} | Biblioteca Financiera`,
    description:
      "Organiza tus registros financieros y revisa tus libros con una experiencia clara y enfocada en productividad.",
    url: "/",
    siteName,
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | Biblioteca Financiera`,
    description:
      "Organiza movimientos, revisa libros y descubre patrones financieros sin friccion.",
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

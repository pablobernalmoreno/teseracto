import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirmacion de Cuenta",
  description: "Confirma tu correo para activar tu cuenta en Teseracto.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/account_confirmation",
  },
};

export default function AccountConfirmationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

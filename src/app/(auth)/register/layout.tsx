import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear Cuenta",
  description: "Crea tu cuenta en Teseracto para empezar a organizar tus planillas.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/register",
  },
};

export default function RegisterLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

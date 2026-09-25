import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesion",
  description: "Accede a tu cuenta de Teseracto para revisar y editar tus libros financieros.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

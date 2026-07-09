export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  ctaLabel: string;
  ctaClassName: string;
  href: string;
  features: string[];
  badge?: string;
  featured?: boolean;
}

export interface PricingComparisonRow {
  label: string;
  free: string;
  pro: string;
}

export const plans: PricingPlan[] = [
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
      "Para organizaciones que ya operan cada semana y necesitan mas capacidad, control y exportacion.",
    ctaLabel: "Elegir mensual",
    ctaClassName: "pricing_btn_secondary",
    href: "/register",
    features: [
      "Libros ilimitados",
      "Hasta 500 movimientos por libro",
      "Lectura automatica ampliada para uso frecuente",
      "Historial y analisis completos",
      "Exportacion a PDF y soporte por correo",
    ],
  },
  {
    name: "Pro anual",
    price: "$199.000",
    period: "/ ano",
    description:
      "La mejor opcion si Teseracto ya hace parte de tu operacion. Equivale a 10 meses y usas 12.",
    ctaLabel: "Elegir anual",
    ctaClassName: "pricing_btn_primary",
    href: "/register",
    badge: "Mejor valor",
    featured: true,
    features: [
      "Todo lo del plan Pro",
      "Ahorro frente al pago mensual",
      "Prioridad para mejoras y soporte",
      "Mas margen para crecer sin cambiar de plan",
      "Ideal para uso continuo durante todo el ano",
    ],
  },
];

export const comparisonRows: PricingComparisonRow[] = [
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
    label: "Lectura automatica de comprobantes",
    free: "Incluido con cupo mensual",
    pro: "Cupo ampliado",
  },
  {
    label: "Panel y metricas",
    free: "Basico",
    pro: "Completo",
  },
  {
    label: "Exportacion PDF",
    free: "No incluida",
    pro: "Incluida",
  },
];

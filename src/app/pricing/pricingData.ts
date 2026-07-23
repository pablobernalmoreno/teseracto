export interface PricingPlan {
  id: PricingPlanId;
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

export type PricingPlanId = "free" | "pro_monthly" | "pro_annual";

export type PaidPricingPlanId = Exclude<PricingPlanId, "free">;

export interface BillingPlanDefinition {
  id: PaidPricingPlanId;
  amountInCents: number;
  currency: "COP";
  wompiDescription: string;
}

export interface PricingComparisonRow {
  label: string;
  free: string;
  pro: string;
}

export const plans: PricingPlan[] = [
  {
    id: "free",
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
    id: "pro_monthly",
    name: "Pro mensual",
    price: "$3.000",
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
    id: "pro_annual",
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

export const BILLING_PLANS: Record<PaidPricingPlanId, BillingPlanDefinition> = {
  pro_monthly: {
    id: "pro_monthly",
    amountInCents: 300000,
    currency: "COP",
    wompiDescription: "Teseracto Pro mensual",
  },
  pro_annual: {
    id: "pro_annual",
    amountInCents: 19900000,
    currency: "COP",
    wompiDescription: "Teseracto Pro anual",
  },
};

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

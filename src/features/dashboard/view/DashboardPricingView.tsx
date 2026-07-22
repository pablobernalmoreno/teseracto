"use client";

import React, { useCallback, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import Link from "next/link";
import {
  comparisonRows,
  plans,
  type PaidPricingPlanId,
  type PricingPlan,
} from "@/app/pricing/pricingData";

interface DashboardPricingViewProps {
  onBack: () => void;
}

interface WompiCheckoutPayload {
  amountInCents: number;
  currency: "COP";
  publicKey: string;
  reference: string;
  signature: string;
  redirectUrl?: string;
}

type WompiTransactionResult = {
  transaction?: {
    id?: string;
    status?: string;
  };
};

type WompiWidgetConfig = {
  currency: "COP";
  amountInCents: number;
  reference: string;
  publicKey: string;
  signature: {
    integrity: string;
  };
  redirectUrl?: string;
};

type WompiWidgetInstance = {
  open: (callback?: (result: WompiTransactionResult) => void) => void;
};

type WompiWidgetConstructor = new (config: WompiWidgetConfig) => WompiWidgetInstance;

declare global {
  interface Window {
    WidgetCheckout?: WompiWidgetConstructor;
  }
}

const WOMPI_WIDGET_SCRIPT_URL = "https://checkout.wompi.co/widget.js";
const WOMPI_WIDGET_LOAD_TIMEOUT_MS = 15000;
const WOMPI_WIDGET_WAIT_STEP_MS = 150;

const isPaidPlan = (plan: PricingPlan): plan is PricingPlan & { id: PaidPricingPlanId } =>
  plan.id !== "free";

const waitForWidgetCheckout = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeoutAt = Date.now() + WOMPI_WIDGET_LOAD_TIMEOUT_MS;

    const check = () => {
      if (window.WidgetCheckout) {
        resolve();
        return;
      }

      if (Date.now() >= timeoutAt) {
        reject(
          new Error(
            "No se pudo cargar Wompi Checkout. Revisa tu conexion, desactiva bloqueadores de contenido y permite checkout.wompi.co."
          )
        );
        return;
      }

      window.setTimeout(check, WOMPI_WIDGET_WAIT_STEP_MS);
    };

    check();
  });
};

const loadWompiWidgetScript = (): Promise<void> => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Wompi widget can only run in the browser."));
  }

  if (window.WidgetCheckout) {
    return Promise.resolve();
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${WOMPI_WIDGET_SCRIPT_URL}"]`
  );

  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener(
        "load",
        () => {
          waitForWidgetCheckout().then(resolve).catch(reject);
        },
        { once: true }
      );
      existingScript.addEventListener(
        "error",
        () =>
          reject(
            new Error(
              "No se pudo descargar el script de Wompi. Revisa red/firewall y que checkout.wompi.co no este bloqueado."
            )
          ),
        { once: true }
      );

      waitForWidgetCheckout()
        .then(resolve)
        .catch(() => {
          // Keep waiting for native load/error events when script exists but is still pending.
        });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = WOMPI_WIDGET_SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      waitForWidgetCheckout().then(resolve).catch(reject);
    };
    script.onerror = () =>
      reject(
        new Error(
          "No se pudo descargar el script de Wompi. Revisa red/firewall y que checkout.wompi.co no este bloqueado."
        )
      );
    document.body.appendChild(script);
  });
};

export const DashboardPricingView: React.FC<DashboardPricingViewProps> = ({ onBack }) => {
  const [loadingPlanId, setLoadingPlanId] = useState<PaidPricingPlanId | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const startCheckout = useCallback(async (planId: PaidPricingPlanId) => {
    try {
      setCheckoutError(null);
      setLoadingPlanId(planId);

      const response = await fetch("/api/billing/wompi/checkout-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "No se pudo iniciar el checkout de Wompi.");
      }

      const payload = (await response.json()) as { data?: WompiCheckoutPayload };
      const checkoutData = payload.data;

      if (!checkoutData) {
        throw new Error("No se recibió configuración de checkout.");
      }

      await loadWompiWidgetScript();

      if (!window.WidgetCheckout) {
        throw new Error("Wompi widget no está disponible en este momento.");
      }

      const checkout = new window.WidgetCheckout({
        currency: checkoutData.currency,
        amountInCents: checkoutData.amountInCents,
        reference: checkoutData.reference,
        publicKey: checkoutData.publicKey,
        signature: {
          integrity: checkoutData.signature,
        },
        redirectUrl: checkoutData.redirectUrl,
      });

      checkout.open((result) => {
        if (result.transaction?.status === "ERROR") {
          setCheckoutError("Wompi reportó un error al iniciar la transacción.");
        }
      });
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "No se pudo iniciar el pago.");
    } finally {
      setLoadingPlanId(null);
    }
  }, []);

  return (
    <Box className="dashboard_pricing_view pricing_box">
      <section className="pricing_hero">
        <Box className="dashboard_pricing_heading">
          <Button
            className="appbar_buttons"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            aria-label="Volver al tablero"
          >
            Volver
          </Button>
          <Typography variant="h5" component="h2" className="pricing_section_title">
            Planes de Teseracto
          </Typography>
        </Box>
        <Typography className="pricing_subtitle">
          Elige el plan que mejor se adapte al ritmo de tu equipo y escala cuando lo necesites.
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
            {isPaidPlan(plan) ? (
              <Button
                className={plan.ctaClassName}
                fullWidth
                onClick={() => startCheckout(plan.id)}
                disabled={loadingPlanId !== null}
              >
                {loadingPlanId === plan.id ? "Iniciando pago..." : plan.ctaLabel}
              </Button>
            ) : (
              <Button component={Link} href={plan.href} className={plan.ctaClassName} fullWidth>
                {plan.ctaLabel}
              </Button>
            )}
          </Box>
        ))}
      </section>

      {checkoutError ? (
        <Typography role="alert" color="error" sx={{ mt: 2 }}>
          {checkoutError}
        </Typography>
      ) : null}

      <section className="pricing_matrix">
        <Typography className="pricing_section_title" component="h3" variant="h6">
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
      </section>
    </Box>
  );
};

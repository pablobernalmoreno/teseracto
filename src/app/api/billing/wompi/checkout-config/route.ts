import crypto from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { BILLING_PLANS, type PaidPricingPlanId } from "@/app/pricing/pricingData";
import { createClient } from "@/app/utils/supabase/server";
import { createServiceRoleClient } from "@/app/utils/supabase/serviceRole";

interface CheckoutConfigRequestBody {
  planId?: string;
}

interface WompiCheckoutConfigResponse {
  amountInCents: number;
  currency: "COP";
  publicKey: string;
  reference: string;
  signature: string;
  redirectUrl?: string;
}

interface BillingPaymentInsert {
  user_id: string;
  provider: "wompi";
  plan_id: PaidPricingPlanId;
  provider_reference: string;
  amount_in_cents: number;
  currency: "COP";
  status: "pending";
  metadata: {
    source: "dashboard_pricing";
  };
}

const isPaidPlanId = (value: string): value is PaidPricingPlanId => value in BILLING_PLANS;

const getWompiEnv = () => {
  const publicKey = process.env.NEXT_PUBLIC_WOMPI;
  const integritySecret = process.env.NEXT_INTEGRITY_WOMPI_URL;

  if (!publicKey || !integritySecret) {
    return {
      ok: false as const,
      message: "Wompi environment variables are not configured.",
    };
  }

  return {
    ok: true as const,
    publicKey,
    integritySecret,
  };
};

const createReference = (planId: PaidPricingPlanId): string => {
  const uniquePart = crypto.randomBytes(8).toString("hex");
  return `teseracto_${planId}_${Date.now()}_${uniquePart}`;
};

const createIntegritySignature = (
  reference: string,
  amountInCents: number,
  integritySecret: string
) => {
  return crypto
    .createHash("sha256")
    .update(`${reference}${amountInCents}COP${integritySecret}`)
    .digest("hex");
};

export const POST = async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const env = getWompiEnv();
  if (!env.ok) {
    return NextResponse.json({ error: env.message }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as CheckoutConfigRequestBody | null;
  const planId = body?.planId?.trim();

  if (!planId || !isPaidPlanId(planId)) {
    return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
  }

  const plan = BILLING_PLANS[planId];
  const reference = createReference(plan.id);
  const signature = createIntegritySignature(reference, plan.amountInCents, env.integritySecret);

  const serviceRoleClient = createServiceRoleClient();
  const paymentIntent: BillingPaymentInsert = {
    user_id: user.id,
    provider: "wompi",
    plan_id: plan.id,
    provider_reference: reference,
    amount_in_cents: plan.amountInCents,
    currency: plan.currency,
    status: "pending",
    metadata: {
      source: "dashboard_pricing",
    },
  };

  const { error: insertError } = await serviceRoleClient
    .from("billing_payments")
    .insert(paymentIntent);

  if (insertError) {
    return NextResponse.json({ error: "Could not create billing intent." }, { status: 500 });
  }

  const responseBody: WompiCheckoutConfigResponse = {
    amountInCents: plan.amountInCents,
    currency: plan.currency,
    publicKey: env.publicKey,
    reference,
    signature,
    redirectUrl: `${request.nextUrl.origin}/dashboard?billing=processing`,
  };

  return NextResponse.json({ data: responseBody });
};

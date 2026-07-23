import crypto from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/app/utils/supabase/serviceRole";
import type { PaidPricingPlanId } from "@/app/pricing/pricingData";

interface WompiWebhookTransaction {
  id?: string;
  status?: string;
  reference?: string;
}

interface WompiWebhookPayload {
  event?: string;
  id?: string;
  data?:
    | WompiWebhookTransaction
    | {
        transaction?: WompiWebhookTransaction;
      };
  signature?: {
    checksum?: string;
    properties?: string[];
    timestamp?: string | number;
  };
  timestamp?: string | number;
}

interface BillingPaymentRow {
  user_id: string;
  plan_id: PaidPricingPlanId;
  ends_at: string | null;
}

interface BillingWebhookEventRow {
  processed: boolean;
}

type RouteError = {
  ok: false;
  message: string;
  status: number;
};

type RouteSuccess<T extends Record<string, unknown> = Record<string, unknown>> = {
  ok: true;
  data: T;
};

type RouteResult<T extends Record<string, unknown> = Record<string, unknown>> =
  RouteSuccess<T> | RouteError;

const getEventSecret = () => process.env.NEXT_EVENT_WOMPI_URL;

const parsePayload = (rawBody: string): WompiWebhookPayload | null => {
  try {
    return JSON.parse(rawBody) as WompiWebhookPayload;
  } catch {
    return null;
  }
};

const getByPath = (source: Record<string, unknown>, path: string): string => {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") {
      return undefined;
    }

    return (acc as Record<string, unknown>)[key];
  }, source);

  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
};

const getSignatureTimestamp = (payload: WompiWebhookPayload) =>
  String(payload.signature?.timestamp ?? payload.timestamp ?? "");

const computeWompiChecksum = (payload: WompiWebhookPayload, eventSecret: string): string | null => {
  const properties = payload.signature?.properties;
  if (!properties || properties.length === 0) {
    return null;
  }

  const signatureSource: Record<string, unknown> = {};
  if (payload.data && typeof payload.data === "object") {
    Object.assign(signatureSource, payload.data);
  }
  signatureSource.event = payload.event;
  signatureSource.id = payload.id;
  signatureSource.timestamp = payload.timestamp;

  const concatenatedProperties = properties
    .map((path) => getByPath(signatureSource, path))
    .join("");
  const timestamp = getSignatureTimestamp(payload);

  if (!timestamp) {
    return null;
  }

  return crypto
    .createHash("sha256")
    .update(`${concatenatedProperties}${timestamp}${eventSecret}`)
    .digest("hex");
};

const timingSafeCompare = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const mapWompiStatusToBillingStatus = (status?: string) => {
  const normalizedStatus = (status || "").trim().toUpperCase();

  if (normalizedStatus === "APPROVED") {
    return "approved" as const;
  }

  if (normalizedStatus === "DECLINED") {
    return "declined" as const;
  }

  if (normalizedStatus === "VOIDED") {
    return "voided" as const;
  }

  return "error" as const;
};

export const getTransactionFromPayload = (
  payload: WompiWebhookPayload
): WompiWebhookTransaction | null => {
  const payloadData = payload.data;

  if (!payloadData || typeof payloadData !== "object") {
    return null;
  }

  if ("transaction" in payloadData && payloadData.transaction) {
    return payloadData.transaction;
  }

  if ("reference" in payloadData || "status" in payloadData || "id" in payloadData) {
    return payloadData as WompiWebhookTransaction;
  }

  return null;
};

const addPlanPeriod = (baseDate: Date, planId: PaidPricingPlanId) => {
  const nextDate = new Date(baseDate);

  if (planId === "pro_monthly") {
    nextDate.setMonth(nextDate.getMonth() + 1);
    return nextDate;
  }

  nextDate.setFullYear(nextDate.getFullYear() + 1);
  return nextDate;
};

const upsertMembershipForApprovedPayment = async (
  userId: string,
  planId: PaidPricingPlanId,
  providerSubscriptionId: string | null,
  serviceRoleClient: ReturnType<typeof createServiceRoleClient>
) => {
  const { data: existingMembership, error: membershipReadError } = await serviceRoleClient
    .from("user_memberships")
    .select("ends_at")
    .eq("user_id", userId)
    .maybeSingle<{ ends_at: string | null }>();

  if (membershipReadError) {
    return { ok: false as const, message: "Could not read membership." };
  }

  const now = new Date();
  const currentEndsAt = existingMembership?.ends_at ? new Date(existingMembership.ends_at) : null;
  const baseDate = currentEndsAt && currentEndsAt > now ? currentEndsAt : now;
  const nextEndsAt = addPlanPeriod(baseDate, planId);

  const { error: membershipUpsertError } = await serviceRoleClient.from("user_memberships").upsert(
    {
      user_id: userId,
      tier: "member",
      status: "active",
      starts_at: now.toISOString(),
      ends_at: nextEndsAt.toISOString(),
      provider: "wompi",
      provider_subscription_id: providerSubscriptionId,
      auto_renew: false,
      canceled_at: null,
    },
    { onConflict: "user_id" }
  );

  if (membershipUpsertError) {
    return { ok: false as const, message: "Could not update membership." };
  }

  return { ok: true as const };
};

const verifyWebhookSignature = (payload: WompiWebhookPayload, eventSecret: string) => {
  const providedChecksum = (payload.signature?.checksum || "").trim().toLowerCase();
  const computedChecksum = computeWompiChecksum(payload, eventSecret);

  if (!providedChecksum || !computedChecksum) {
    return false;
  }

  return timingSafeCompare(providedChecksum, computedChecksum);
};

const persistWebhookEvent = async (
  payload: WompiWebhookPayload,
  eventHash: string,
  eventType: string | null,
  eventId: string | null,
  serviceRoleClient: ReturnType<typeof createServiceRoleClient>
): Promise<RouteResult<{ duplicate: boolean }>> => {
  const { error: eventInsertError } = await serviceRoleClient
    .from("billing_webhook_events")
    .insert({
      provider: "wompi",
      event_id: eventId,
      event_hash: eventHash,
      event_type: eventType,
      payload,
      processed: false,
    });

  if (!eventInsertError) {
    return { ok: true, data: { duplicate: false } };
  }

  if (eventInsertError.code !== "23505") {
    return { ok: false, message: "Could not persist webhook event.", status: 500 };
  }

  const { data: existingEvent, error: existingEventError } = await serviceRoleClient
    .from("billing_webhook_events")
    .select("processed")
    .eq("event_hash", eventHash)
    .maybeSingle<BillingWebhookEventRow>();

  if (existingEventError) {
    return { ok: false, message: "Could not load existing webhook event.", status: 500 };
  }

  if (existingEvent?.processed) {
    return { ok: true, data: { duplicate: true } };
  }

  return { ok: true, data: { duplicate: false } };
};

const syncPaymentFromTransaction = async (
  payload: WompiWebhookPayload,
  eventType: string | null,
  serviceRoleClient: ReturnType<typeof createServiceRoleClient>
): Promise<RouteResult> => {
  const transaction = getTransactionFromPayload(payload);
  const reference = transaction?.reference?.trim();
  const providerTransactionId = transaction?.id?.trim() || null;
  const nextStatus = mapWompiStatusToBillingStatus(transaction?.status);

  if (!reference) {
    return { ok: false, message: "Missing transaction reference.", status: 400 };
  }

  const { data: payment, error: paymentReadError } = await serviceRoleClient
    .from("billing_payments")
    .select("user_id, plan_id")
    .eq("provider_reference", reference)
    .maybeSingle<BillingPaymentRow>();

  if (paymentReadError || !payment) {
    return { ok: false, message: "Payment intent not found.", status: 404 };
  }

  const { error: paymentUpdateError } = await serviceRoleClient
    .from("billing_payments")
    .update({
      provider_transaction_id: providerTransactionId,
      status: nextStatus,
      paid_at: nextStatus === "approved" ? new Date().toISOString() : null,
      metadata: {
        webhook_event: eventType,
      },
    })
    .eq("provider_reference", reference);

  if (paymentUpdateError) {
    return { ok: false, message: "Could not update payment status.", status: 500 };
  }

  if (nextStatus !== "approved") {
    return { ok: true, data: {} };
  }

  const membershipResult = await upsertMembershipForApprovedPayment(
    payment.user_id,
    payment.plan_id,
    providerTransactionId,
    serviceRoleClient
  );

  if (!membershipResult.ok) {
    return { ok: false, message: membershipResult.message, status: 500 };
  }

  return { ok: true, data: {} };
};

const markWebhookEventProcessed = async (
  eventHash: string,
  serviceRoleClient: ReturnType<typeof createServiceRoleClient>
): Promise<RouteResult> => {
  const { error: markProcessedError } = await serviceRoleClient
    .from("billing_webhook_events")
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq("event_hash", eventHash);

  if (markProcessedError) {
    return {
      ok: false,
      message: "Webhook processed but event log update failed.",
      status: 500,
    };
  }

  return { ok: true, data: {} };
};

export const POST = async (request: NextRequest) => {
  const eventSecret = getEventSecret();
  if (!eventSecret) {
    console.error("[wompi-webhook] missing event secret configuration");
    return NextResponse.json({ error: "Missing Wompi event secret." }, { status: 500 });
  }

  const rawBody = await request.text();
  const payload = parsePayload(rawBody);

  if (!payload) {
    console.warn("[wompi-webhook] invalid JSON payload", {
      bodyLength: rawBody.length,
    });
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const eventType = payload.event || null;
  const eventId = payload.id || null;

  if (!verifyWebhookSignature(payload, eventSecret)) {
    console.warn("[wompi-webhook] invalid signature", {
      eventType,
      eventId,
      hasSignature: Boolean(payload.signature?.checksum),
    });
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const eventHash = crypto.createHash("sha256").update(rawBody).digest("hex");

  const serviceRoleClient = createServiceRoleClient();

  const persistResult = await persistWebhookEvent(
    payload,
    eventHash,
    eventType,
    eventId,
    serviceRoleClient
  );
  if (!persistResult.ok) {
    console.error("[wompi-webhook] failed to persist event", {
      eventType,
      eventId,
      status: persistResult.status,
      message: persistResult.message,
    });
    return NextResponse.json({ error: persistResult.message }, { status: persistResult.status });
  }
  if (persistResult.data.duplicate) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const syncResult = await syncPaymentFromTransaction(payload, eventType, serviceRoleClient);
  if (!syncResult.ok) {
    console.error("[wompi-webhook] failed to sync payment", {
      eventType,
      eventId,
      status: syncResult.status,
      message: syncResult.message,
    });
    return NextResponse.json({ error: syncResult.message }, { status: syncResult.status });
  }

  const processedResult = await markWebhookEventProcessed(eventHash, serviceRoleClient);
  if (!processedResult.ok) {
    console.error("[wompi-webhook] failed to mark event processed", {
      eventType,
      eventId,
      status: processedResult.status,
      message: processedResult.message,
    });
    return NextResponse.json(
      { error: processedResult.message },
      { status: processedResult.status }
    );
  }

  return NextResponse.json({ ok: true });
};

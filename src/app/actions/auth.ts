"use server";

import { createClient } from "@/app/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getClientIdentifier, takeRateLimit } from "@/app/utils/security/rateLimit";
import { isValidEmail, normalizeEmail } from "@/app/utils/security/validation";

const INVALID_CREDENTIALS_MESSAGE = "Correo o contraseña incorrectos.";

async function isRateLimited(namespace: string, key: string, limit: number, windowMs: number) {
  const requestHeaders = await headers();
  const clientId = getClientIdentifier(requestHeaders);
  return takeRateLimit({
    key: `${namespace}:${clientId}:${key}`,
    limit,
    windowMs,
  });
}

export async function signInAction(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedPassword = password.trim();

  const signInRateLimit = await isRateLimited(
    "auth:signin",
    normalizedEmail || "invalid",
    5,
    15 * 60 * 1000
  );
  if (!signInRateLimit.allowed) {
    return { success: false, error: "Demasiados intentos. Intenta nuevamente más tarde." };
  }

  if (!isValidEmail(normalizedEmail) || !trimmedPassword) {
    return { success: false, error: INVALID_CREDENTIALS_MESSAGE };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: trimmedPassword,
  });

  if (error) {
    return { success: false, error: INVALID_CREDENTIALS_MESSAGE };
  }

  redirect("/main");
}

export async function signUpAction(email: string, password: string, confirmPassword: string) {
  const normalizedEmail = normalizeEmail(email);

  const signUpRateLimit = await isRateLimited(
    "auth:signup",
    normalizedEmail || "invalid",
    5,
    60 * 60 * 1000
  );
  if (!signUpRateLimit.allowed) {
    return { success: false, error: "Demasiados intentos. Intenta nuevamente más tarde." };
  }

  if (!isValidEmail(normalizedEmail)) {
    return { success: false, error: "Ingresa un correo electrónico válido." };
  }

  if (password !== confirmPassword || password.length < 8) {
    return { success: false, error: "La contraseña debe tener al menos 8 caracteres y coincidir." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  redirect("/account_confirmation");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/login");
}

export async function resendConfirmationEmailAction(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const resendRateLimit = await isRateLimited(
    "auth:resend-confirmation",
    normalizedEmail || "invalid",
    3,
    60 * 60 * 1000
  );
  if (!resendRateLimit.allowed) {
    return { success: false, error: "Demasiados intentos. Intenta nuevamente más tarde." };
  }

  if (!isValidEmail(normalizedEmail)) {
    return { success: false, error: "Ingresa un correo electrónico válido." };
  }

  // Note: Supabase doesn't expose a client-side method to resend confirmation emails
  // For now, users need to use email magic links or sign up again
  // In production, you'd likely want to use a custom email service or the admin API
  return { success: true };
}

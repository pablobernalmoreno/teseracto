import type { MainData } from "@/types/dashboard";

export const GENERIC_REQUEST_ERROR = "No se pudo completar la solicitud.";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export function isJsonContentType(contentType: string | null): boolean {
  return Boolean(contentType?.toLowerCase().includes("application/json"));
}

export function getBearerToken(authorizationHeader?: string | null): string | null {
  const authorization = authorizationHeader ?? "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authorization.slice(7).trim();
  return token || null;
}

export function parseTrimmedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    return null;
  }

  return trimmed;
}

export function normalizeBookIds(value: unknown, maxIds = 100): string[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > maxIds) {
    return null;
  }

  const bookIds = [...new Set(value.map((id) => String(id).trim()).filter(Boolean))];
  return bookIds.length > 0 ? bookIds : null;
}

function isMainDataEntry(value: unknown): value is MainData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.date === "string" &&
    typeof candidate.money === "string" &&
    typeof candidate.id === "number" &&
    Number.isInteger(candidate.id) &&
    Number.isFinite(candidate.id)
  );
}

export function normalizeMainDataArray(value: unknown, maxItems = 500): MainData[] | null {
  if (!Array.isArray(value) || value.length > maxItems) {
    return null;
  }

  if (!value.every(isMainDataEntry)) {
    return null;
  }

  return value.map((entry) => ({
    id: entry.id,
    date: entry.date.trim(),
    money: entry.money.trim(),
  }));
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Returns the trimmed value when it is a real `YYYY-MM-DD` calendar date, otherwise null.
 * Fails closed: anything that is not a string, or not a real date, is rejected.
 */
export function parseIsoDate(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  const match = ISO_DATE_PATTERN.exec(trimmed);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // Date rolls an impossible day over (31 Feb becomes 3 Mar), so compare the parts back.
  const candidate = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day;

  return isRealDate ? trimmed : null;
}

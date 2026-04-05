import type { MainData } from "@/types/dashboard";

export const GENERIC_REQUEST_ERROR = "Request could not be completed.";

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

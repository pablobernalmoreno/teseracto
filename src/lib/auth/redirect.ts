const DEFAULT_AUTH_REDIRECT_PATH = "/main";

function hasUnsafeScheme(candidate: string): boolean {
  const normalized = candidate.trim().toLowerCase();
  return /^[a-z][a-z0-9+.-]*:/.test(normalized) || normalized.startsWith("//");
}

function hasUnsafeControlChars(candidate: string): boolean {
  return /[\u0000-\u001f\u007f]/.test(candidate) || /%0[ad]/i.test(candidate);
}

export function getSafeAuthRedirectPath(nextPath: string | null): string {
  if (!nextPath) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  const rawCandidate = nextPath.trim();
  const decodedCandidate = (() => {
    try {
      return decodeURIComponent(rawCandidate);
    } catch {
      return rawCandidate;
    }
  })();

  const candidate = decodedCandidate.trim();

  if (!candidate || !candidate.startsWith("/")) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  if (
    candidate.includes("\\") ||
    hasUnsafeScheme(candidate) ||
    hasUnsafeControlChars(candidate) ||
    candidate.includes("<") ||
    candidate.includes(">") ||
    candidate.includes("javascript:")
  ) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  return candidate;
}

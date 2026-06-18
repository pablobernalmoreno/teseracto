const DEFAULT_AUTH_REDIRECT_PATH = "/main";

export function getSafeAuthRedirectPath(nextPath: string | null): string {
  if (!nextPath) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  const candidate = nextPath.trim();

  // Only allow app-relative paths and block protocol-relative redirect targets.
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  // Normalize suspicious path separators that can be interpreted differently downstream.
  if (candidate.includes("\\")) {
    return DEFAULT_AUTH_REDIRECT_PATH;
  }

  return candidate;
}

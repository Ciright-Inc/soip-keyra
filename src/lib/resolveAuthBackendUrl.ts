/** Direct simsecure-auth-session origin for server-side fetch (dev default :4000). */
function directAuthSessionOrigin(): string {
  const fromEnv =
    process.env.SIMSECURE_AUTH_BACKEND_URL?.trim() ||
    process.env.SIMSECURE_AUTH_SESSION_URL?.trim() ||
    "";
  if (fromEnv.startsWith("http://") || fromEnv.startsWith("https://")) {
    return fromEnv.replace(/\/+$/, "");
  }
  return "http://127.0.0.1:4000";
}

/**
 * Resolve SimSecure auth API base for server-side fetch.
 * `NEXT_PUBLIC_SIMSECURE_AUTH_BACKEND_URL=/api/simsecure-auth` is a browser dev proxy path;
 * server routes must call the auth session on :4000 (or SIMSECURE_AUTH_BACKEND_URL).
 */
export function resolveAuthBackendUrl(req?: Request): string {
  const raw =
    process.env.SIMSECURE_AUTH_BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_SIMSECURE_AUTH_BACKEND_URL?.trim() ||
    "";
  if (!raw) return directAuthSessionOrigin();
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/+$/, "");
  }
  if (raw.startsWith("/")) {
    const proxyPath = raw.replace(/\/+$/, "");
    if (req) {
      const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "")
        .split(",")[0]
        ?.trim();
      const proto =
        req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https" ? "https" : "http";
      if (host) {
        return `${proto}://${host}${proxyPath}`;
      }
    }
    return directAuthSessionOrigin();
  }
  return directAuthSessionOrigin();
}

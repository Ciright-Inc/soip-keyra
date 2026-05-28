/**
 * Auth backend base URL (shared with Get Started / SimSecure).
 *
 * - Absolute: https://auth.example.com
 * - Host-only: auth.example.com (normalized to https://auth.example.com)
 * - Relative: /api/simsecure-auth (same-origin proxy)
 *
 * Local default: http://localhost:4000
 */
const raw = process.env.NEXT_PUBLIC_SIMSECURE_AUTH_BACKEND_URL ?? "http://localhost:4000";
const trimmed = String(raw).trim();

export function resolveAuthBackendUrl(input = trimmed): string {
  const s = String(input || "").trim();
  if (!s) return "";
  if (s.startsWith("/")) {
    return s.replace(/\/$/, "");
  }
  if (/^https?:\/\//i.test(s)) {
    return s.replace(/\/$/, "");
  }
  const host = s.split("/")[0] || "";
  const isLocal =
    /^localhost(:\d+)?$/i.test(host) ||
    /^127\.0\.0\.1(:\d+)?$/i.test(host) ||
    /^\[::1\](:\d+)?$/i.test(host);
  return `${isLocal ? "http" : "https"}://${s.replace(/\/$/, "")}`;
}

export const AUTH_BACKEND_URL = resolveAuthBackendUrl();


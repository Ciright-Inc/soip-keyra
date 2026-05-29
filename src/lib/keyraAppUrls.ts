/**
 * URL helpers for the Get Started login bridge — mirrors keyra/src/lib/keyraAppUrls.ts
 * but trimmed to what SOIP needs: get-started.keyra.ie + same-origin admin continue bridge.
 */

function trimSlash(s: string): string {
  return s.replace(/\/+$/, "");
}

/**
 * Force an absolute origin: if `raw` has no http(s) protocol, prepend `https://`.
 * Defends against env vars set without a scheme (e.g. NEXT_PUBLIC_SOIP_URL=soip.keyra.ie).
 */
function ensureHttpProtocol(raw: string): string {
  const v = raw.trim();
  if (!v) return v;
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("localhost") || v.startsWith("127.0.0.1")) return `http://${v}`;
  return `https://${v}`;
}

export function canonicalKeyraHostname(hostname: string): string {
  return hostname.toLowerCase() === "www.keyra.ie" ? "keyra.ie" : hostname;
}

/** Normalize absolute Keyra return URLs to the canonical marketing host. */
export function normalizeKeyraReturnUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return trimmed;
  try {
    const url = new URL(trimmed);
    url.hostname = canonicalKeyraHostname(url.hostname);
    return url.toString();
  } catch {
    return trimmed;
  }
}

export function keyraGetStartedUrl(): string {
  return trimSlash(
    ensureHttpProtocol(
      process.env.NEXT_PUBLIC_GET_STARTED_URL?.trim() || "https://get-started.keyra.ie",
    ),
  );
}

/**
 * Public origin for this SOIP deployment (used to build absolute return URLs).
 *
 * Resolution order:
 *   1. Browser  → `window.location.origin` (always matches the host the user is on,
 *      so the same build works on Railway preview, `soip.keyra.ie`, or any other host
 *      without env changes).
 *   2. Server   → `NEXT_PUBLIC_SOIP_URL` / `NEXT_PUBLIC_SOIP_PUBLIC_ORIGIN` env var.
 *   3. Fallback → `http://localhost:3060` in dev, `https://soip.keyra.ie` in production.
 */
export function soipPublicOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return trimSlash(window.location.origin);
  }
  const explicit =
    process.env.NEXT_PUBLIC_SOIP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SOIP_PUBLIC_ORIGIN?.trim();
  if (explicit) return trimSlash(ensureHttpProtocol(explicit));
  if (process.env.NODE_ENV !== "production") return "http://localhost:3060";
  return "https://soip.keyra.ie";
}

/**
 * Open Get Started with optional `return` query — after login/verification the user is
 * redirected back to this absolute URL.
 */
export function buildGetStartedAccessUrl(returnToAbsoluteUrl: string): string {
  const gs = keyraGetStartedUrl();
  let u = returnToAbsoluteUrl.trim();
  // If the caller passes a path or a host without protocol, treat it as same-origin.
  if (!u.startsWith("http://") && !u.startsWith("https://")) {
    const base = ensureHttpProtocol(soipPublicOrigin());
    const path = u.startsWith("/") ? u : `/${u}`;
    u = `${trimSlash(base)}${path}`;
  }
  u = normalizeKeyraReturnUrl(u);
  // Final guard: if we somehow still don't have a scheme, force https before
  // handing the URL to get-started — get-started silently drops return URLs
  // that don't start with `http`.
  u = ensureHttpProtocol(u);
  return `${gs}/?return=${encodeURIComponent(u)}`;
}

/** After Get Started / hosted login — sync auth into keyra_session, then open `nextPath`. */
export function buildKeyraSessionContinueUrl(nextPath: string): string {
  const base = ensureHttpProtocol(soipPublicOrigin());
  const path = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${trimSlash(base)}/api/keyra/session/continue?next=${encodeURIComponent(path)}`;
}

/** Admin "Login on Keyra" — return via session bridge so cookies sync on same origin. */
export function buildAdminGetStartedAccessUrl(nextPath: string): string {
  return buildGetStartedAccessUrl(buildKeyraSessionContinueUrl(nextPath));
}

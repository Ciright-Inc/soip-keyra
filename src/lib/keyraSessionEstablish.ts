import "server-only";

import type { KeyraSessionUser } from "@/lib/keyraSessionCookie";
import { isValidMobileE164 } from "@/lib/adminUserPhone";
import { buildKeyraSessionUser } from "@/lib/keyraSessionResponse";
import { fetchAuthSessionSnapshot } from "@/lib/keyraProtection";

export async function resolveKeyraSessionUserFromAuth(
  req: Request,
): Promise<KeyraSessionUser | null> {
  const auth = await fetchAuthSessionSnapshot(req);
  if (!auth.authenticated || !auth.phoneE164) return null;
  return buildKeyraSessionUser(auth.phoneE164, auth);
}

export async function resolveKeyraSessionUserFromPhone(
  phone: string,
): Promise<KeyraSessionUser | null> {
  const trimmed = phone.trim();
  if (!isValidMobileE164(trimmed)) return null;
  return buildKeyraSessionUser(trimmed);
}

export function pickPhoneFromSearchParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): string | null {
  const read = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) {
      return params.get(key)?.trim();
    }
    const raw = params[key];
    return (Array.isArray(raw) ? raw[0] : raw)?.trim();
  };

  for (const key of ["phone", "phoneNumber", "mobile", "msisdn"]) {
    const v = read(key);
    if (v?.startsWith("+")) return v;
  }
  return null;
}

/**
 * Fallback phone used by /api/keyra/session/continue when no auth cookie is available.
 *
 *  - In dev (NODE_ENV !== production): always honoured if `KEYRA_DEV_SESSION_PHONE` is set.
 *  - In production: only honoured when `KEYRA_ALLOW_PHONE_FALLBACK_IN_PROD=1` is set
 *    AND `KEYRA_DEV_SESSION_PHONE` is set. This is intended for cross-domain preview
 *    deployments (e.g. soip-keyra-production.up.railway.app) where `.keyra.ie` cookies
 *    cannot reach the app. Do NOT enable on `soip.keyra.ie` — the proper cookie-based
 *    flow works there without this escape hatch.
 */
export function devSessionPhoneFallback(): string | null {
  const phone = process.env.KEYRA_DEV_SESSION_PHONE?.trim();
  if (!phone?.startsWith("+")) return null;
  if (process.env.NODE_ENV !== "production") return phone;
  if (process.env.KEYRA_ALLOW_PHONE_FALLBACK_IN_PROD === "1") return phone;
  return null;
}

export function safeSessionContinueNext(raw: string | null | undefined): string {
  const next = raw?.trim() || "/";
  return next.startsWith("/") ? next : "/";
}

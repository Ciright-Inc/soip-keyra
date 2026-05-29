import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import {
  KEYRA_SESSION_COOKIE,
  KEYRA_SESSION_MAX_AGE,
  type KeyraSessionUser,
} from "@/lib/keyraSessionTypes";

export { KEYRA_SESSION_COOKIE, KEYRA_SESSION_MAX_AGE, type KeyraSessionUser };

/**
 * Shared across *.keyra.ie in production so SOIP and the Keyra marketing site
 * both see the same `keyra_session` cookie. Override with KEYRA_SESSION_COOKIE_DOMAIN.
 */
export function keyraSessionCookieDomain(): string | undefined {
  const configured = process.env.KEYRA_SESSION_COOKIE_DOMAIN?.trim();
  if (configured === "none" || configured === "off") return undefined;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") return ".keyra.ie";
  return undefined;
}

export function keyraSessionCookieWriteOptions(maxAge: number): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
  domain?: string;
} {
  const domain = keyraSessionCookieDomain();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
    ...(domain ? { domain } : {}),
  };
}

function sessionSecret(): string | null {
  const s = process.env.KEYRA_SESSION_SECRET?.trim();
  if (s) return s;
  if (process.env.NODE_ENV === "production") return null;
  return "__keyra_dev_session_secret__";
}

export function serializeSession(user: KeyraSessionUser): string | null {
  const secret = sessionSecret();
  if (!secret) return null;
  const body = Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function parseSession(cookieValue: string): KeyraSessionUser | null {
  const secret = sessionSecret();
  if (!secret) return null;
  try {
    const lastDot = cookieValue.lastIndexOf(".");
    if (lastDot <= 0) return null;
    const body = cookieValue.slice(0, lastDot);
    const sig = cookieValue.slice(lastDot + 1);
    const expected = createHmac("sha256", secret).update(body).digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const json = Buffer.from(body, "base64url").toString("utf8");
    const user = JSON.parse(json) as KeyraSessionUser;
    if (!user.phoneE164 || typeof user.phoneE164 !== "string") return null;
    return user;
  } catch {
    return null;
  }
}

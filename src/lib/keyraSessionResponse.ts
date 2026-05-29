import {
  KEYRA_SESSION_COOKIE,
  KEYRA_SESSION_MAX_AGE,
  keyraSessionCookieWriteOptions,
  serializeSession,
  type KeyraSessionUser,
} from "@/lib/keyraSessionCookie";
import { NextResponse } from "next/server";

type AuthProfileHint = {
  displayName?: string | null;
  fullName?: string | null;
  username?: string | null;
  email?: string | null;
};

function displayNameFromAuthHint(auth?: AuthProfileHint): string | undefined {
  const displayName = String(auth?.displayName ?? "").trim();
  if (displayName) return displayName;
  const fullName = String(auth?.fullName ?? "").trim();
  if (fullName) return fullName;
  const username = String(auth?.username ?? "").trim();
  if (username) return username;
  return undefined;
}

/**
 * Build a KeyraSessionUser from a phone number plus optional profile hints from
 * the SimSecure auth payload. SOIP does not (yet) persist site profile fields
 * locally, so this is hint-only.
 */
export function buildKeyraSessionUser(
  phoneE164: string,
  authHint?: AuthProfileHint,
): KeyraSessionUser {
  const fromAuth = displayNameFromAuthHint(authHint);
  const fromAuthEmail = authHint?.email ? String(authHint.email).trim() : undefined;
  return {
    phoneE164,
    displayName: fromAuth,
    email: fromAuthEmail || undefined,
  };
}

function hostnameFromOrigin(origin: string | undefined | null): string | undefined {
  if (!origin) return undefined;
  try {
    return new URL(origin).hostname;
  } catch {
    return undefined;
  }
}

/**
 * Non-httpOnly companion cookie set alongside the signed `keyra_session`.
 * The client uses it as a short-lived "freshly minted" marker to suppress
 * the cross-origin auth probe's `authenticated:false` response right after
 * a phone-bridge sign-in (when `.keyra.ie` SimSecure cookies have not yet
 * propagated to this browser tab on cross-domain hosts like Railway).
 */
const KEYRA_SESSION_FRESH_COOKIE = "keyra_session_fresh";
const KEYRA_SESSION_FRESH_MAX_AGE = 30; // seconds

function attachKeyraSessionCookie(
  res: NextResponse,
  token: string,
  host?: string | null,
): void {
  res.cookies.set({
    name: KEYRA_SESSION_COOKIE,
    value: token,
    ...keyraSessionCookieWriteOptions(KEYRA_SESSION_MAX_AGE, host ?? undefined),
  });
  // Companion freshness marker — readable by client JS so the session context
  // can grace-period the cross-origin probe right after sign-in.
  const sessionOpts = keyraSessionCookieWriteOptions(
    KEYRA_SESSION_FRESH_MAX_AGE,
    host ?? undefined,
  );
  res.cookies.set({
    name: KEYRA_SESSION_FRESH_COOKIE,
    value: "1",
    ...sessionOpts,
    httpOnly: false,
  });
}

export function jsonWithKeyraSession(
  user: KeyraSessionUser,
  body: Record<string, unknown> = { ok: true },
  host?: string | null,
): NextResponse | null {
  const token = serializeSession(user);
  if (!token) return null;
  const res = NextResponse.json({ ...body, user });
  attachKeyraSessionCookie(res, token, host);
  return res;
}

export function redirectWithKeyraSession(
  user: KeyraSessionUser,
  nextPath: string,
  origin: string,
): NextResponse | null {
  const token = serializeSession(user);
  if (!token) return null;
  const safeNext = nextPath.startsWith("/") ? nextPath : "/";
  const res = NextResponse.redirect(new URL(safeNext, origin));
  attachKeyraSessionCookie(res, token, hostnameFromOrigin(origin));
  return res;
}

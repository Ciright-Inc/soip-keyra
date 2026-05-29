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

function attachKeyraSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set({
    name: KEYRA_SESSION_COOKIE,
    value: token,
    ...keyraSessionCookieWriteOptions(KEYRA_SESSION_MAX_AGE),
  });
}

export function jsonWithKeyraSession(
  user: KeyraSessionUser,
  body: Record<string, unknown> = { ok: true },
): NextResponse | null {
  const token = serializeSession(user);
  if (!token) return null;
  const res = NextResponse.json({ ...body, user });
  attachKeyraSessionCookie(res, token);
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
  attachKeyraSessionCookie(res, token);
  return res;
}

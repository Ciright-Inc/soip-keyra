import "server-only";

import {
  KEYRA_SESSION_COOKIE,
  parseSession,
  type KeyraSessionUser,
} from "@/lib/keyraSessionCookie";

type AuthSessionPayload = {
  authenticated?: boolean;
  user?: {
    phone?: string;
    username?: string | null;
    fullName?: string | null;
    displayName?: string | null;
    email?: string | null;
  } | null;
};

function readCookie(cookieHeader: string, name: string): string | null {
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${name}=`)) {
      return decodeURIComponent(trimmed.slice(name.length + 1));
    }
  }
  return null;
}

function displayNameFromAuthUser(user: NonNullable<AuthSessionPayload["user"]>): string | undefined {
  const displayName = typeof user.displayName === "string" ? user.displayName.trim() : "";
  if (displayName) return displayName;
  const fullName = typeof user.fullName === "string" ? user.fullName.trim() : "";
  if (fullName) return fullName;
  const username = typeof user.username === "string" ? user.username.trim() : "";
  if (username) return username;
  return undefined;
}

function userFromAuthPayload(payload: AuthSessionPayload): KeyraSessionUser | null {
  if (!payload.authenticated || !payload.user?.phone) return null;
  const raw = payload.user.phone.trim();
  if (!raw) return null;
  const phoneE164 = raw.startsWith("+") ? raw : `+${raw.replace(/\D/g, "")}`;
  const email = typeof payload.user.email === "string" ? payload.user.email.trim() : undefined;
  return {
    phoneE164,
    displayName: displayNameFromAuthUser(payload.user),
    email: email || undefined,
  };
}

function mergeSessionUsers(
  cookieUser: KeyraSessionUser | null,
  authUser: KeyraSessionUser | null,
): KeyraSessionUser | null {
  if (!cookieUser && !authUser) return null;
  if (cookieUser && authUser && cookieUser.phoneE164 !== authUser.phoneE164) {
    return authUser;
  }
  const phoneE164 = authUser?.phoneE164 ?? cookieUser?.phoneE164 ?? "";
  if (!phoneE164) return null;
  return {
    phoneE164,
    displayName: authUser?.displayName?.trim() || cookieUser?.displayName?.trim() || undefined,
    email: authUser?.email?.trim() || cookieUser?.email,
    country: cookieUser?.country ?? authUser?.country,
  };
}

async function resolveKeyraSessionFromCookieHeader(
  cookieHeader: string,
): Promise<KeyraSessionUser | null> {
  const keyraRaw = readCookie(cookieHeader, KEYRA_SESSION_COOKIE);
  const cookieUser = keyraRaw ? parseSession(keyraRaw) : null;

  const backend = process.env.NEXT_PUBLIC_SIMSECURE_AUTH_BACKEND_URL?.trim();
  if (!backend) return cookieUser;

  try {
    const res = await fetch(`${backend.replace(/\/+$/, "")}/auth/session`, {
      method: "GET",
      headers: { cookie: cookieHeader },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return cookieUser;
    const payload = (await res.json()) as AuthSessionPayload;
    if (payload.authenticated === false) {
      // SimSecure auth cookies may expire when the browser closes; keep the signed
      // keyra_session cookie (30-day) so admin stays signed in.
      return cookieUser;
    }
    const authUser = userFromAuthPayload(payload);
    if (!authUser) return cookieUser;
    return mergeSessionUsers(cookieUser, authUser);
  } catch {
    return cookieUser;
  }
}

/** Resolve the same Keyra identity used by the public site session (auth session is source of truth). */
export async function resolveKeyraSessionFromRequest(req: Request): Promise<KeyraSessionUser | null> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  return resolveKeyraSessionFromCookieHeader(cookieHeader);
}

export async function resolveKeyraSessionFromCookies(): Promise<KeyraSessionUser | null> {
  const { cookies, headers } = await import("next/headers");
  const jar = await cookies();
  const keyraRaw = jar.get(KEYRA_SESSION_COOKIE)?.value;
  const cookieUser = keyraRaw ? parseSession(keyraRaw) : null;

  const hdrs = await headers();
  const cookieHeader = hdrs.get("cookie") ?? "";
  if (!cookieHeader) return cookieUser;
  return resolveKeyraSessionFromCookieHeader(cookieHeader);
}

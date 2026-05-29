import { resolveKeyraRedirectOrigin } from "@/lib/adminHost";
import {
  devSessionPhoneFallback,
  pickPhoneFromSearchParams,
  resolveKeyraSessionUserFromAuth,
  resolveKeyraSessionUserFromPhone,
  safeSessionContinueNext,
} from "@/lib/keyraSessionEstablish";
import { redirectWithKeyraSession } from "@/lib/keyraSessionResponse";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Establishes keyra_session from auth cookies, return URL phone params, or dev fallback,
 * then redirects to `next`. Route handlers may set cookies; Server Components cannot.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const nextPath = safeSessionContinueNext(url.searchParams.get("next"));
  const origin = resolveKeyraRedirectOrigin(req, nextPath);

  const fromAuth = await resolveKeyraSessionUserFromAuth(req);
  if (fromAuth) {
    const res = redirectWithKeyraSession(fromAuth, nextPath, origin);
    if (res) return res;
  }

  const phone = pickPhoneFromSearchParams(url.searchParams) ?? devSessionPhoneFallback();
  if (phone) {
    const fromPhone = await resolveKeyraSessionUserFromPhone(phone);
    if (fromPhone) {
      const res = redirectWithKeyraSession(fromPhone, nextPath, origin);
      if (res) return res;
    }
  }

  if (nextPath.startsWith("/admin")) {
    const login = new URL("/admin/login", origin);
    login.searchParams.set("next", nextPath);
    login.searchParams.set("reason", "sign_in");
    return NextResponse.redirect(login);
  }

  return NextResponse.redirect(new URL(nextPath || "/", origin));
}

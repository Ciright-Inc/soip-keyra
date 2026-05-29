import { cookies, headers } from "next/headers";
import {
  KEYRA_SESSION_COOKIE,
  keyraSessionCookieWriteOptions,
  parseSession,
  type KeyraSessionUser,
} from "@/lib/keyraSessionCookie";
import { NextResponse } from "next/server";

export async function GET() {
  const jar = await cookies();
  const raw = jar.get(KEYRA_SESSION_COOKIE)?.value;
  if (!raw) {
    return NextResponse.json({ user: null as KeyraSessionUser | null });
  }
  const user = parseSession(raw);
  if (!user) {
    const hdrs = await headers();
    const host =
      hdrs.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      hdrs.get("host")?.split(",")[0]?.trim() ||
      undefined;
    const res = NextResponse.json({ user: null as KeyraSessionUser | null });
    res.cookies.set({
      name: KEYRA_SESSION_COOKIE,
      value: "",
      ...keyraSessionCookieWriteOptions(0, host),
    });
    return res;
  }
  return NextResponse.json({ user });
}

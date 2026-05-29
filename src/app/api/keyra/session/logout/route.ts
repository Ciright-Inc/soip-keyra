import { KEYRA_SESSION_COOKIE, keyraSessionCookieWriteOptions } from "@/lib/keyraSessionCookie";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host")?.split(",")[0]?.trim() ||
    undefined;
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: KEYRA_SESSION_COOKIE,
    value: "",
    ...keyraSessionCookieWriteOptions(0, host),
  });
  return res;
}

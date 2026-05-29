import { KEYRA_SESSION_COOKIE, keyraSessionCookieWriteOptions } from "@/lib/keyraSessionCookie";
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: KEYRA_SESSION_COOKIE,
    value: "",
    ...keyraSessionCookieWriteOptions(0),
  });
  return res;
}

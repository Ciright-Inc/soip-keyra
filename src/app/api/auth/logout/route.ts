import { resolveAuthBackendUrl } from "@/lib/resolveAuthBackendUrl";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const raw =
    process.env.SIMSECURE_AUTH_BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_SIMSECURE_AUTH_BACKEND_URL?.trim();
  if (!raw) {
    return new NextResponse(null, { status: 204 });
  }

  const base = resolveAuthBackendUrl(request);

  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const res = await fetch(`${base}/auth/logout`, {
      method: "POST",
      headers: { cookie: cookieHeader },
    });
    const response = new NextResponse(null, { status: res.status });
    const setCookies =
      res.headers.getSetCookie?.() ?? (res.headers.get("set-cookie") ? [res.headers.get("set-cookie")!] : []);
    for (const c of setCookies) {
      response.headers.append("set-cookie", c);
    }
    return response;
  } catch (err) {
    console.error("[soip:api/auth/logout]", err);
    return new NextResponse(null, { status: 204 });
  }
}

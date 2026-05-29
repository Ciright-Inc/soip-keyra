import { resolveAuthBackendUrl } from "@/lib/resolveAuthBackendUrl";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const base = resolveAuthBackendUrl(request);
  if (!base) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(`${base}/auth/session`, {
      method: "GET",
      headers: { cookie: cookieHeader },
      signal: controller.signal,
      cache: "no-store",
    });
    const json = await res.json();
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ authenticated: false, user: null });
  } finally {
    clearTimeout(timeout);
  }
}

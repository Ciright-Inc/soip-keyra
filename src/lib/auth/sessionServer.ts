import { cookies, headers } from "next/headers";
import { resolveAuthBackendUrl } from "@/lib/auth/auth-config";

export type ServerAuthSession = {
  authenticated: boolean;
  user: { id: number; phone: string; fullName?: string | null; email?: string | null; profileComplete?: boolean } | null;
};

function authBaseServer(): string {
  const raw =
    process.env.SIMSECURE_AUTH_BACKEND_URL ??
    process.env.NEXT_PUBLIC_SIMSECURE_AUTH_BACKEND_URL ??
    "http://localhost:4000";
  const resolved = resolveAuthBackendUrl(raw);
  if (resolved.startsWith("/")) {
    const h = headers().get("host") || "localhost:3060";
    const proto = process.env.NODE_ENV === "production" ? "https" : "http";
    return `${proto}://${h}${resolved}`;
  }
  return resolved;
}

function serializeRequestCookies(): string {
  const jar = cookies();
  return jar
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

export async function getServerAuthSession(): Promise<ServerAuthSession> {
  const base = authBaseServer();
  if (!base) return { authenticated: false, user: null };
  try {
    const res = await fetch(`${base}/auth/session`, {
      method: "GET",
      cache: "no-store",
      headers: {
        cookie: serializeRequestCookies(),
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });
    if (!res.ok) return { authenticated: false, user: null };
    const json = (await res.json()) as ServerAuthSession;
    return json?.authenticated ? { authenticated: true, user: json.user ?? null } : { authenticated: false, user: null };
  } catch {
    return { authenticated: false, user: null };
  }
}


import { resolveAuthBackendUrl } from "@/lib/resolveAuthBackendUrl";

export type AuthSessionSnapshot = {
  authenticated: boolean;
  phoneE164?: string;
  profileComplete?: boolean;
  email?: string | null;
  fullName?: string | null;
  displayName?: string | null;
  username?: string | null;
};

/** Fetch the SimSecure auth session snapshot, forwarding the request cookies. */
export async function fetchAuthSessionSnapshot(req: Request): Promise<AuthSessionSnapshot> {
  const base = resolveAuthBackendUrl(req);
  if (!base) return { authenticated: false };

  try {
    const res = await fetch(`${base}/auth/session`, {
      method: "GET",
      headers: { cookie: req.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    if (!res.ok) return { authenticated: false };
    const json = (await res.json()) as {
      authenticated?: boolean;
      user?: {
        phone?: string;
        email?: string | null;
        fullName?: string | null;
        displayName?: string | null;
        username?: string | null;
        profileComplete?: boolean;
      } | null;
    };
    if (!json.authenticated || !json.user?.phone) return { authenticated: false };
    const phone = json.user.phone.startsWith("+") ? json.user.phone : `+${json.user.phone}`;
    return {
      authenticated: true,
      phoneE164: phone,
      profileComplete: json.user.profileComplete,
      email: json.user.email,
      fullName: json.user.fullName,
      displayName: json.user.displayName,
      username: json.user.username,
    };
  } catch {
    return { authenticated: false };
  }
}

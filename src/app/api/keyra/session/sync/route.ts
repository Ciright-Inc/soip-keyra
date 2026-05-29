import { rateLimitResponse } from "@/app/api/keyra/_routeHelpers";
import { fetchAuthSessionSnapshot } from "@/lib/keyraProtection";
import { buildKeyraSessionUser, jsonWithKeyraSession } from "@/lib/keyraSessionResponse";
import { NextResponse } from "next/server";

/**
 * Creates or refreshes keyra_session from the active SimSecure auth session cookie
 * (same cookie the auth backend set after Get Started / hosted login).
 */
export async function POST(req: Request) {
  const limited = rateLimitResponse(req, "session-sync");
  if (limited) return limited;

  const auth = await fetchAuthSessionSnapshot(req);
  if (!auth.authenticated || !auth.phoneE164) {
    return NextResponse.json({ error: "No active auth session." }, { status: 401 });
  }

  const user = buildKeyraSessionUser(auth.phoneE164, auth);
  const res = jsonWithKeyraSession(user, { ok: true, synced: true });
  if (!res) {
    return NextResponse.json(
      {
        error:
          "Session signing is not configured. Set KEYRA_SESSION_SECRET in production.",
      },
      { status: 503 },
    );
  }
  return res;
}

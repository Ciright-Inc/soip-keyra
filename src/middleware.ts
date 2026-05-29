import { NextResponse, type NextRequest } from "next/server";

const KEYRA_SESSION_COOKIE = "keyra_session";

/**
 * Paths that must remain reachable to anyone (logged in or not). Everything
 * else on this SOIP deployment requires a Keyra session cookie. The actual
 * AdminUser authorization check still happens server-side in
 * `assertAdminServer` for /admin/* segments.
 */
const PUBLIC_EXACT_PATHS = new Set<string>([
  "/admin/login",
  "/auth/continue",
  "/favicon.ico",
  "/favicon.png",
  "/robots.txt",
  "/sitemap.xml",
]);

const PUBLIC_PATH_PREFIXES = [
  "/api/keyra/session/",
  "/api/auth/",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  for (const prefix of PUBLIC_PATH_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const sessionCookie = req.cookies.get(KEYRA_SESSION_COOKIE)?.value;
  if (sessionCookie) return NextResponse.next();

  // For API calls return a JSON 401 so fetch() callers don't end up parsing
  // an HTML redirect target. UI navigations to /api/* are not expected — the
  // browser routes there only via XHR / fetch.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "unauthenticated", message: "Keyra session required." },
      { status: 401 },
    );
  }

  const target = `${pathname}${search ?? ""}`;
  const url = req.nextUrl.clone();
  url.pathname = "/auth/continue";
  url.search = `?next=${encodeURIComponent(target)}`;
  return NextResponse.redirect(url);
}

/**
 * Run on every request except Next internals and static files. The matcher
 * intentionally excludes `_next/static`, `_next/image`, and any path that
 * looks like a static asset (contains a dot in the last segment).
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.png|robots\\.txt|sitemap\\.xml|.*\\..*).*)",
  ],
};

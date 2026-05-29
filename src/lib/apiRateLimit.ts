type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Sliding-ish fixed window rate limiter (per Node instance). */
export function allowRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

export function rateLimitKeyFromRequest(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  const realIp = h.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_LIMIT = 24;

export function rateLimitResponse(
  req: Request,
  routeKey: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS,
): Response | null {
  const ip = rateLimitKeyFromRequest(req);
  const key = `${ip}:${routeKey}`;
  if (!allowRateLimit(key, limit, windowMs)) {
    return Response.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }
  return null;
}

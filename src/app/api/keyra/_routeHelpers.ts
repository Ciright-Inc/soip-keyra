import { rateLimitResponse as baseRateLimit } from "@/lib/apiRateLimit";

export async function readJsonObject(req: Request): Promise<Record<string, unknown>> {
  try {
    const j: unknown = await req.json();
    return typeof j === "object" && j !== null && !Array.isArray(j)
      ? (j as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function rateLimitResponse(
  req: Request,
  routeKey: string,
  limit?: number,
  windowMs?: number,
): Response | null {
  return baseRateLimit(req, routeKey, limit, windowMs);
}

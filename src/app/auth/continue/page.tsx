import { redirect } from "next/navigation";

type Search = Record<string, string | string[] | undefined>;

function toQueryString(sp: Search): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string" && value.length > 0) {
      qs.set(key, value);
    }
  }
  const q = qs.toString();
  return q ? `?${q}` : "";
}

/** Forwards to the route handler that may set session cookies (Server Components cannot). */
export default async function AuthContinuePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  redirect(`/api/keyra/session/continue${toQueryString(sp)}`);
}

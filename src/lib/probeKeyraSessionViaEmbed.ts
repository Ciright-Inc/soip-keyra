import { keyraGetStartedUrl } from "@/lib/keyraAppUrls";

/** Must match get-started-simsecure `keyraEmbedSession.ts`. */
export const KEYRA_EMBED_SESSION_SOURCE = "keyra-embed-session" as const;

type EmbedSessionPayload = {
  authenticated: boolean;
  user?: {
    phone?: string | null;
    fullName?: string | null;
    displayName?: string | null;
    email?: string | null;
  } | null;
};

type AuthSessionPayload = {
  authenticated: boolean;
  user?: {
    phone?: string;
    username?: string | null;
    fullName?: string | null;
    displayName?: string | null;
    email?: string | null;
  } | null;
};

function embedMessageToPayload(message: EmbedSessionPayload): AuthSessionPayload {
  if (!message.authenticated) {
    return { authenticated: false, user: null };
  }
  const phone = message.user?.phone?.trim();
  if (!phone) return { authenticated: false, user: null };
  return {
    authenticated: true,
    user: {
      phone,
      fullName: message.user?.fullName ?? null,
      displayName: message.user?.displayName ?? null,
      email: message.user?.email ?? null,
    },
  };
}

function isTrustedEmbedOrigin(origin: string): boolean {
  try {
    const trusted = new URL(keyraGetStartedUrl()).origin;
    return origin === trusted;
  } catch {
    return false;
  }
}

/**
 * Probe SimSecure session via a hidden iframe on get-started.keyra.ie (first-party
 * for `.keyra.ie` cookies). Used on cross-domain SOIP hosts (Railway) where
 * `fetch(auth-backend)` cannot see partitioned cookies.
 *
 * Returns `null` when the probe could not run (timeout / blocked iframe).
 */
export function probeKeyraSessionViaEmbed(
  signal?: AbortSignal,
  timeoutMs = 8000,
): Promise<AuthSessionPayload | null> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(null);
  }

  const embedOrigin = (() => {
    try {
      return new URL(keyraGetStartedUrl()).origin;
    } catch {
      return null;
    }
  })();
  if (!embedOrigin) return Promise.resolve(null);

  return new Promise((resolve) => {
    let settled = false;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.setAttribute("tabindex", "-1");
    iframe.title = "Keyra session probe";
    iframe.style.cssText =
      "position:fixed;width:1px;height:1px;left:-9999px;top:-9999px;border:0;opacity:0;pointer-events:none";

    const finish = (payload: AuthSessionPayload | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      if (signal) signal.removeEventListener("abort", onAbort);
      iframe.remove();
      resolve(payload);
    };

    const onAbort = () => finish(null);

    const onMessage = (event: MessageEvent) => {
      if (!isTrustedEmbedOrigin(event.origin)) return;
      const data = event.data as { source?: string; authenticated?: boolean };
      if (data?.source !== KEYRA_EMBED_SESSION_SOURCE) return;
      if (typeof data.authenticated !== "boolean") return;
      finish(embedMessageToPayload(data as EmbedSessionPayload));
    };

    const timer = window.setTimeout(() => finish(null), timeoutMs);

    window.addEventListener("message", onMessage);
    if (signal) {
      if (signal.aborted) {
        finish(null);
        return;
      }
      signal.addEventListener("abort", onAbort);
    }

    iframe.src = `${embedOrigin}/embed/session`;
    document.body.appendChild(iframe);
  });
}

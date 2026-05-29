"use client";

import { useEffect, useRef, useState } from "react";
import { useKeyraSession } from "@/contexts/KeyraSessionContext";
import { buildAdminGetStartedAccessUrl } from "@/lib/keyraAppUrls";

type Props = {
  /** Path to navigate to once a Keyra session is detected. Any same-origin path is allowed. */
  nextPath: string;
  /** When true, do not auto-redirect (used when ?force=1 is set on the gate). */
  disabled?: boolean;
};

/**
 * Per-tab marker that we've already attempted to bridge through
 * `get-started.keyra.ie`. Prevents an infinite redirect loop when the visitor
 * is not logged in anywhere — after the first bounce they see the SOIP login
 * gate instead of going round again. Cleared on logout via `clearAutoBridgeAttempted`.
 */
const BRIDGE_FLAG = "soip:bridge-attempted";

function hasAttemptedAutoBridge(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.sessionStorage.getItem(BRIDGE_FLAG) === "1";
  } catch {
    return true;
  }
}

function markAutoBridgeAttempted(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(BRIDGE_FLAG, "1");
  } catch {
    // ignore — private mode / storage disabled
  }
}

export function clearAutoBridgeAttempted(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(BRIDGE_FLAG);
  } catch {
    // ignore
  }
}

/**
 * Client-side counterpart to AdminAuthWatcher for the *anonymous* admin login
 * page. While the user is sitting on /admin/login, this component:
 *  - polls /api/auth/session every 3s (faster than the global 15s cadence) so
 *    a sign-in happening on another sub-domain (cookie set on .keyra.ie) is
 *    picked up quickly without a hard refresh,
 *  - refreshes immediately on window focus / visibility change so coming back
 *    from the Keyra login tab triggers an instant redirect,
 *  - listens for cross-tab signals (BroadcastChannel + localStorage) so a
 *    same-origin login that fires `keyra-auth-login` is honoured immediately,
 *  - does a full-page navigate to `nextPath` once a session appears so the
 *    server re-runs assertAdminServer (this catches the no_access case where
 *    the user has a Keyra session but not an active AdminUser row).
 */
export function AdminLoginRedirect({ nextPath, disabled = false }: Props) {
  const { isAuthenticated, initialized, refresh, user } = useKeyraSession();
  const redirectingRef = useRef(false);
  // True until we have decided whether to redirect (auth → nextPath / bridge
  // → Get Started) OR show the login gate. Hides the login UI during the
  // initial cross-domain auth check so visitors who are already signed in on
  // another Keyra site never flash the SOIP gate.
  const [coverVisible, setCoverVisible] = useState(!disabled);

  // 1) Authenticated → either:
  //    - if SOIP already minted a `keyra_session` cookie this session, just
  //      navigate to `nextPath` (the middleware will let it through), or
  //    - if we only know the phone via a cross-origin probe (Railway preview
  //      or any cross-parent-domain host), bounce through
  //      `/api/keyra/session/continue?phone=…&next=…` so the SOIP server can
  //      mint the cookie before we land on `nextPath`. Without this, the
  //      middleware would see no cookie and redirect right back to the gate.
  useEffect(() => {
    if (disabled) return;
    if (!initialized) return;
    if (!isAuthenticated) return;
    if (redirectingRef.current) return;
    if (typeof window === "undefined") return;

    redirectingRef.current = true;
    clearAutoBridgeAttempted();
    const safeNext =
      nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";

    const hasCookie =
      typeof document !== "undefined" &&
      document.cookie.split(";").some((c) => c.trim().startsWith("keyra_session="));

    if (hasCookie) {
      window.location.replace(safeNext);
      return;
    }

    const phone = user?.phoneE164?.trim();
    if (phone?.startsWith("+")) {
      const url = `/api/keyra/session/continue?next=${encodeURIComponent(
        safeNext,
      )}&phone=${encodeURIComponent(phone)}`;
      window.location.replace(url);
      return;
    }

    // No cookie and no phone we can use — fall back to the regular redirect;
    // the middleware will re-gate if the cookie is still missing on arrival.
    window.location.replace(safeNext);
  }, [disabled, initialized, isAuthenticated, nextPath, user?.phoneE164]);

  // 2) Not authenticated AND we have not yet bounced through Get Started this
  //    tab → silently bridge so visitors who are already logged in on another
  //    Keyra site land on `nextPath` without ever seeing the SOIP login gate.
  //    Get Started auto-redirects back here with `?phone=` (when its session
  //    is active) so SOIP can mint a `keyra_session` cookie immediately.
  //    If the visitor has already bounced once (sessionStorage flag set), we
  //    drop the cover and reveal the gate so they can act manually.
  useEffect(() => {
    if (disabled) return;
    if (!initialized) return;
    if (isAuthenticated) return;
    if (redirectingRef.current) return;
    if (typeof window === "undefined") return;

    if (hasAttemptedAutoBridge()) {
      setCoverVisible(false);
      return;
    }

    redirectingRef.current = true;
    markAutoBridgeAttempted();
    const safeNext =
      nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
    const bridge = buildAdminGetStartedAccessUrl(safeNext);
    window.location.replace(bridge);
  }, [disabled, initialized, isAuthenticated, nextPath]);

  // Drop the cover when ?force=1 is set so the gate is visible immediately.
  useEffect(() => {
    if (disabled) setCoverVisible(false);
  }, [disabled]);

  // Sync the SSR cover (rendered by the page server-side to avoid a flash of
  // the gate UI on first paint) with the client-side cover state. Once we
  // decide to reveal the gate, remove the SSR cover too so it's not stacked
  // beneath ours forever.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const ssrCover = document.getElementById("soip-auth-cover");
    if (!ssrCover) return;
    if (coverVisible) {
      ssrCover.style.display = "none"; // our React cover is now on top
    } else {
      ssrCover.parentNode?.removeChild(ssrCover);
    }
  }, [coverVisible]);

  useEffect(() => {
    if (disabled) return undefined;
    if (typeof window === "undefined") return undefined;
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [disabled, refresh]);

  useEffect(() => {
    if (disabled) return undefined;
    if (typeof document === "undefined") return undefined;

    let interval: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (interval) return;
      interval = setInterval(() => {
        void refresh();
      }, 3000);
    };
    const stop = () => {
      if (!interval) return;
      clearInterval(interval);
      interval = null;
    };

    if (document.visibilityState === "visible") start();
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void refresh();
        start();
      } else {
        stop();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      stop();
    };
  }, [disabled, refresh]);

  useEffect(() => {
    if (disabled) return undefined;
    if (typeof window === "undefined") return undefined;
    let channel: BroadcastChannel | undefined;
    try {
      channel = new BroadcastChannel("keyra-auth");
      channel.onmessage = (event) => {
        if (event?.data?.type === "login") {
          void refresh();
        }
      };
    } catch {
      // BroadcastChannel not supported
    }
    return () => channel?.close();
  }, [disabled, refresh]);

  useEffect(() => {
    if (disabled) return undefined;
    if (typeof window === "undefined") return undefined;
    const onStorage = (event: StorageEvent) => {
      if (event.key === "keyra-auth-login") {
        void refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [disabled, refresh]);

  // bfcache guard: when the user clicks the browser Back button while signed
  // in, the browser may restore /admin/login from the back-forward cache
  // without re-running the server's "redirect if authenticated" check. Force
  // a full reload on that restore so the server (which sees the cookie) sends
  // them straight to nextPath instead of letting them sit on the login page.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  // Opaque cover hides the underlying gate UI while we run the cross-domain
  // auth check / silently bridge to Get Started. Removed once the gate must
  // actually be shown (visitor not logged in anywhere and bridge already used).
  if (coverVisible) {
    return (
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--ds-canvas-soft, #fff)",
          zIndex: 9999,
        }}
      />
    );
  }
  return null;
}

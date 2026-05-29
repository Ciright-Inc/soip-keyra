"use client";

import { useEffect, useRef } from "react";
import { useKeyraSession } from "@/contexts/KeyraSessionContext";

type Props = {
  /** Path to navigate to once a Keyra session is detected. Any same-origin path is allowed. */
  nextPath: string;
  /** When true, do not auto-redirect (used when ?force=1 is set on the gate). */
  disabled?: boolean;
};

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
  const { isAuthenticated, initialized, refresh } = useKeyraSession();
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (disabled) return;
    if (!initialized) return;
    if (!isAuthenticated) return;
    if (redirectingRef.current) return;
    if (typeof window === "undefined") return;

    redirectingRef.current = true;
    // Same-origin path: must start with `/` and not `//` (protocol-relative).
    const safeNext =
      nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
    window.location.replace(safeNext);
  }, [disabled, initialized, isAuthenticated, nextPath]);

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

  return null;
}

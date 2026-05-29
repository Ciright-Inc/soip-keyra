"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useKeyraSession } from "@/contexts/KeyraSessionContext";

/**
 * Keeps the admin console reactive to session changes:
 *  - When the Keyra session becomes null (own logout, logout from another tab/
 *    sub-domain, cookie expiry, backend revocation) the admin shell immediately
 *    bounces the user to /admin/login instead of waiting for a hard refresh.
 *  - Polls /api/auth/session more aggressively while the admin tab is active so
 *    cross-sub-domain logouts (which can't use BroadcastChannel) are detected
 *    in a few seconds rather than the global 15s cadence.
 *  - Refreshes on window focus and listens to a shared localStorage flag for
 *    instant cross-tab (same-origin) signalling.
 */
export function AdminAuthWatcher() {
  const { isAuthenticated, initialized, refresh } = useKeyraSession();
  const pathname = usePathname() ?? "/admin";
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (!initialized) return;
    if (isAuthenticated) return;
    if (redirectingRef.current) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname.startsWith("/admin/login")) return;

    redirectingRef.current = true;
    const next = pathname.startsWith("/admin") ? pathname : "/admin";
    const params = new URLSearchParams({ reason: "sign_in", next });
    window.location.replace(`/admin/login?${params.toString()}`);
  }, [initialized, isAuthenticated, pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (typeof document === "undefined") return undefined;

    let interval: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (interval) return;
      interval = setInterval(() => {
        void refresh();
      }, 5000);
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
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onStorage = (event: StorageEvent) => {
      if (event.key === "keyra-auth-logout") {
        void refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  return null;
}

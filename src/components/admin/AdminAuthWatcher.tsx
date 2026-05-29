"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { useKeyraSession } from "@/contexts/KeyraSessionContext";

const AUTH_LOGOUT_STORAGE_KEY = "keyra-auth-logout";

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
const PUBLIC_PATH_PREFIXES = ["/admin/login", "/auth/continue"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function safeNextPath(pathname: string): string {
  if (pathname.startsWith("/") && !pathname.startsWith("//")) return pathname;
  return "/";
}

export function AdminAuthWatcher() {
  const { isAuthenticated, initialized, refresh } = useKeyraSession();
  const pathname = usePathname() ?? "/";
  const redirectingRef = useRef(false);

  const redirectToLogin = useCallback(() => {
    if (redirectingRef.current) return;
    if (typeof window === "undefined") return;
    if (isPublicPath(window.location.pathname)) return;

    redirectingRef.current = true;
    const next = safeNextPath(pathname);
    const params = new URLSearchParams({ reason: "sign_in", next });
    window.location.replace(`/admin/login?${params.toString()}`);
  }, [pathname]);

  useEffect(() => {
    if (!initialized) return;
    if (isAuthenticated) return;
    redirectToLogin();
  }, [initialized, isAuthenticated, redirectToLogin]);

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
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onStorage = (event: StorageEvent) => {
      if (event.key === AUTH_LOGOUT_STORAGE_KEY) {
        // Same-origin logout in another tab — redirect immediately, don't wait
        // for the next poll (matches keyra admin instant sign-out UX).
        redirectToLogin();
        void refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh, redirectToLogin]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let channel: BroadcastChannel | undefined;
    try {
      channel = new BroadcastChannel("keyra-auth");
      channel.onmessage = (event) => {
        if (event?.data?.type === "logout") {
          redirectToLogin();
          void refresh();
        }
      };
    } catch {
      // BroadcastChannel not supported
    }
    return () => channel?.close();
  }, [refresh, redirectToLogin]);

  return null;
}

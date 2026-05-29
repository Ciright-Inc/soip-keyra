"use client";

import type { KeyraSessionUser } from "@/lib/keyraSessionTypes";
import { formatPhoneDisplay } from "@/lib/keyraSessionDisplay";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const AUTH_CHANNEL = "keyra-auth";
const AUTH_STORAGE_KEY = "keyra-auth-logout";
const AUTH_LOGIN_STORAGE_KEY = "keyra-auth-login";
/** sessionStorage key set by AdminLoginRedirect when it bridges through Get Started. */
const BRIDGE_FLAG = "soip:bridge-attempted";
/**
 * Session refresh should be resilient to variable network latency (especially when
 * /api/auth/session proxies to the external auth backend). A too-short timeout causes
 * false sign-outs / admin redirects.
 */
const SESSION_TIMEOUT_MS = 20_000;

const defaultUser: KeyraSessionUser = { phoneE164: "" };

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

function authSessionDisplayName(user: NonNullable<AuthSessionPayload["user"]>): string | undefined {
  const displayName = typeof user.displayName === "string" ? user.displayName.trim() : "";
  if (displayName) return displayName;
  const fullName = typeof user.fullName === "string" ? user.fullName.trim() : "";
  if (fullName) return fullName;
  const username = typeof user.username === "string" ? user.username.trim() : "";
  if (username) return username;
  return undefined;
}

async function clearKeyraCookieSession(): Promise<void> {
  try {
    await fetch("/api/keyra/session/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore
  }
}

async function clearSimsecureAuthSession(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // continue to direct backend
  }

  const authBackendUrl =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SIMSECURE_AUTH_BACKEND_URL?.trim() : "";
  if (!authBackendUrl) return;

  try {
    const base = authBackendUrl.replace(/\/+$/, "");
    await fetch(`${base}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore
  }
}

async function fetchKeyraCookieUser(signal?: AbortSignal): Promise<KeyraSessionUser | null> {
  try {
    const res = await fetch("/api/keyra/session/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { user?: KeyraSessionUser | null };
    return json.user?.phoneE164 ? json.user : null;
  } catch {
    return null;
  }
}

async function syncKeyraSessionFromAuth(signal?: AbortSignal): Promise<KeyraSessionUser | null> {
  try {
    const res = await fetch("/api/keyra/session/sync", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { user?: KeyraSessionUser };
    return json.user?.phoneE164 ? json.user : null;
  } catch {
    return null;
  }
}

/**
 * Returns true when this page's host shares no parent domain with the auth
 * backend (e.g. SOIP on `*.up.railway.app` while auth lives on `.keyra.ie`).
 * In that case the same-origin `/api/auth/session` proxy can't see the
 * `.keyra.ie` auth cookies, so its negative response is meaningless and must
 * not be used to invalidate the local `keyra_session` cookie.
 */
function isCrossDomainFromAuthBackend(): boolean {
  if (typeof window === "undefined") return false;
  const backend =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SIMSECURE_AUTH_BACKEND_URL?.trim()
      : "";
  if (!backend) return false;
  try {
    const backendHost = new URL(backend).hostname.toLowerCase();
    const currentHost = window.location.hostname.toLowerCase();
    if (!backendHost || !currentHost) return false;
    if (backendHost === currentHost) return false;
    const tail = (h: string) => h.split(".").slice(-2).join(".");
    return tail(backendHost) !== tail(currentHost);
  } catch {
    return false;
  }
}

async function fetchCrossOriginAuthSession(
  signal?: AbortSignal,
): Promise<AuthSessionPayload | null> {
  const authBackendUrl =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SIMSECURE_AUTH_BACKEND_URL : "";
  if (!authBackendUrl?.trim()) return null;

  try {
    const base = authBackendUrl.replace(/\/+$/, "");
    const res = await fetch(`${base}/auth/session`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as AuthSessionPayload;
  } catch {
    return null;
  }
}

async function fetchAuthSessionPayload(signal?: AbortSignal): Promise<AuthSessionPayload | null> {
  const crossDomain = isCrossDomainFromAuthBackend();

  // On Railway / other cross-parent hosts, probe the auth backend first — the
  // browser attaches `.keyra.ie` SimSecure cookies only on that origin. This is
  // how we detect login AND logout on other Keyra sites without a hard refresh.
  if (crossDomain) {
    const crossOrigin = await fetchCrossOriginAuthSession(signal);
    if (crossOrigin) return crossOrigin;
  }

  // Same-origin proxy (works on `*.keyra.ie` where cookies reach the SOIP server).
  let proxyResult: AuthSessionPayload | null = null;
  try {
    const res = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      signal,
    });
    if (res.ok) {
      proxyResult = (await res.json()) as AuthSessionPayload;
      if (proxyResult?.authenticated) return proxyResult;
    }
  } catch {
    // continue to fallback
  }

  if (!crossDomain) {
    // On `.keyra.ie`, the proxy is authoritative when cross-origin wasn't needed.
    return proxyResult;
  }

  // Cross-domain: proxy can't see auth cookies — try cross-origin once more.
  const crossOriginRetry = await fetchCrossOriginAuthSession(signal);
  if (crossOriginRetry) return crossOriginRetry;

  // CORS/network blocked — inconclusive; keep local keyra_session until we can probe.
  return null;
}

function userFromAuthPayload(payload: AuthSessionPayload): KeyraSessionUser | null {
  if (!payload?.authenticated || !payload?.user?.phone) return null;
  const phone = payload.user.phone.startsWith("+") ? payload.user.phone : `+${payload.user.phone}`;
  const email =
    typeof payload.user.email === "string" ? payload.user.email.trim() : undefined;
  return {
    phoneE164: phone,
    displayName: authSessionDisplayName(payload.user),
    email: email || undefined,
  };
}

function mergeKeyraSessionUsers(
  cookieUser: KeyraSessionUser | null,
  authUser: KeyraSessionUser | null,
): KeyraSessionUser | null {
  if (!cookieUser && !authUser) return null;
  if (cookieUser && authUser && cookieUser.phoneE164 !== authUser.phoneE164) {
    return authUser;
  }
  const phoneE164 = authUser?.phoneE164 ?? cookieUser?.phoneE164 ?? "";
  if (!phoneE164) return null;
  return {
    phoneE164,
    displayName:
      authUser?.displayName?.trim() || cookieUser?.displayName?.trim() || undefined,
    email: authUser?.email?.trim() || cookieUser?.email,
    country: cookieUser?.country ?? authUser?.country,
  };
}

async function fetchSessionUser(signal?: AbortSignal): Promise<KeyraSessionUser | null> {
  const [cookieUser, payload] = await Promise.all([
    fetchKeyraCookieUser(signal),
    fetchAuthSessionPayload(signal),
  ]);

  // Definitive signed-out signal (the trusted probe explicitly said so).
  // Cross-domain deployments will get `payload === null` (inconclusive) when
  // the cross-origin probe is blocked, so we only clear local state on a
  // confirmed `authenticated === false` from a probe we can trust.
  if (payload && payload.authenticated === false) {
    await Promise.all([clearSimsecureAuthSession(), clearKeyraCookieSession()]);
    return null;
  }

  const authUser =
    payload?.authenticated && payload?.user?.phone ? userFromAuthPayload(payload) : null;

  // Probe inconclusive (e.g. cross-domain on Railway with CORS blocked) —
  // trust the locally-signed `keyra_session` cookie if present.
  if (!payload && cookieUser) return cookieUser;

  if (cookieUser && authUser && cookieUser.phoneE164 !== authUser.phoneE164) {
    const synced = await syncKeyraSessionFromAuth(signal);
    return synced ?? authUser;
  }

  if (!cookieUser && authUser) {
    const synced = await syncKeyraSessionFromAuth(signal);
    return synced ?? authUser;
  }

  if (cookieUser && authUser) {
    const merged = mergeKeyraSessionUsers(cookieUser, authUser);
    if (
      merged &&
      authUser.displayName?.trim() &&
      merged.displayName !== cookieUser.displayName?.trim()
    ) {
      void syncKeyraSessionFromAuth(signal).catch(() => {
        // best-effort
      });
    }
    return merged;
  }

  if (cookieUser && !payload) return cookieUser;
  return authUser ?? null;
}

type KeyraSessionContextValue = {
  user: KeyraSessionUser | null;
  isAuthenticated: boolean;
  initialized: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (next: Partial<KeyraSessionUser> | null) => void;
  /** Name if set, otherwise formatted phone */
  headerLabel: string | null;
};

const KeyraSessionContext = createContext<KeyraSessionContextValue | null>(null);

export function KeyraSessionProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  /** Parsed from httpOnly cookie on the server — keeps SSR and hydration aligned. */
  initialUser?: KeyraSessionUser | null;
}) {
  const [user, setUserState] = useState<KeyraSessionUser | null>(initialUser);
  const [initialized, setInitialized] = useState(false);
  const fetchingRef = useRef(false);

  const fetchSession = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SESSION_TIMEOUT_MS);
    try {
      const next = await fetchSessionUser(controller.signal);
      setUserState((prev) => {
        if (next === null) return null;
        if (
          prev &&
          next.phoneE164 === prev.phoneE164 &&
          next.displayName === prev.displayName &&
          next.email === prev.email &&
          next.country === prev.country
        ) {
          return prev;
        }
        // null → authenticated: notify other same-origin tabs so anonymous
        // pages (e.g. /admin/login) can react without waiting for their own poll.
        if (!prev && next && typeof window !== "undefined") {
          try {
            new BroadcastChannel(AUTH_CHANNEL).postMessage({ type: "login" });
          } catch {
            // ignore — BroadcastChannel not supported
          }
          try {
            window.localStorage.setItem(AUTH_LOGIN_STORAGE_KEY, String(Date.now()));
          } catch {
            // ignore — private mode
          }
        }
        return next;
      });
    } catch {
      setUserState((prev) => (prev !== null ? null : prev));
    } finally {
      clearTimeout(timeout);
      fetchingRef.current = false;
      setInitialized(true);
    }
  }, []);

  const setUser = useCallback((next: Partial<KeyraSessionUser> | null) => {
    if (!next) {
      setUserState(null);
      return;
    }
    setUserState((prev) => ({
      ...defaultUser,
      ...(prev && typeof prev === "object" ? prev : {}),
      ...(typeof next === "object" ? next : {}),
    }));
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchSession();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchSession]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) fetchingRef.current = false;
      void fetchSession();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [fetchSession]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let interval: ReturnType<typeof setInterval>;
    const schedulePoll = () => {
      clearInterval(interval);
      if (document.visibilityState === "visible") {
        interval = setInterval(fetchSession, 15000);
      }
    };
    schedulePoll();
    document.addEventListener("visibilitychange", schedulePoll);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", schedulePoll);
    };
  }, [fetchSession]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let channel: BroadcastChannel | undefined;
    try {
      channel = new BroadcastChannel(AUTH_CHANNEL);
      channel.onmessage = (e) => {
        if (e?.data?.type === "logout") {
          setUserState(null);
          void clearKeyraCookieSession();
        }
      };
    } catch {
      // BroadcastChannel not supported
    }
    return () => channel?.close();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEY) {
        setUserState(null);
        void clearKeyraCookieSession();
        void fetchSession();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fetchSession]);

  const logout = useCallback(async () => {
    await Promise.all([clearSimsecureAuthSession(), clearKeyraCookieSession()]);
    setUserState(null);
    // Reset the per-tab "we already bridged through Get Started" marker so
    // the next visit auto-bridges again instead of going straight to the gate.
    try {
      window.sessionStorage.removeItem(BRIDGE_FLAG);
    } catch {
      // ignore
    }
    try {
      new BroadcastChannel(AUTH_CHANNEL).postMessage({ type: "logout" });
    } catch {
      // ignore
    }
    try {
      window.localStorage.setItem(AUTH_STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore — private mode or storage disabled
    }
  }, []);

  const isAuthenticated = !!user;

  const headerLabel = useMemo(() => {
    if (!user) return null;
    const name = user.displayName?.trim();
    if (name) return name;
    return formatPhoneDisplay(user.phoneE164);
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      initialized,
      refresh: fetchSession,
      logout,
      setUser,
      headerLabel,
    }),
    [user, isAuthenticated, initialized, fetchSession, logout, setUser, headerLabel],
  );

  return (
    <KeyraSessionContext.Provider value={value}>{children}</KeyraSessionContext.Provider>
  );
}

export function useKeyraSession() {
  const ctx = useContext(KeyraSessionContext);
  if (!ctx) {
    throw new Error("useKeyraSession must be used within KeyraSessionProvider");
  }
  return ctx;
}

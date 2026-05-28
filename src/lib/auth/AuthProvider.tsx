"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AUTH_BACKEND_URL } from "@/lib/auth/auth-config";

const AUTH_CHANNEL = "simsecure-auth";

export type AuthUser = {
  id: number;
  phone: string;
  fullName?: string | null;
  email?: string | null;
  profileComplete?: boolean;
};

export type AuthContextValue = {
  user: AuthUser | null;
  hydrated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const hasFetchedRef = useRef(false);

  const fetchSession = useCallback(async () => {
    if (!AUTH_BACKEND_URL) {
      setUser(null);
      setHydrated(true);
      return;
    }
    try {
      const res = await fetch(`${AUTH_BACKEND_URL}/auth/session`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      if (!res.ok) {
        setUser((prev) => (prev !== null ? null : prev));
        setHydrated(true);
        return;
      }
      const json = (await res.json()) as { authenticated: boolean; user: AuthUser | null };
      const nextUser = json.authenticated ? json.user : null;
      setUser((prev) =>
        prev?.id === nextUser?.id &&
        prev?.phone === nextUser?.phone &&
        prev?.fullName === nextUser?.fullName &&
        prev?.email === nextUser?.email &&
        prev?.profileComplete === nextUser?.profileComplete
          ? prev
          : nextUser,
      );
    } catch {
      setUser((prev) => (prev !== null ? null : prev));
    } finally {
      setHydrated(true);
    }
  }, []);

  const refresh = useCallback(() => fetchSession(), [fetchSession]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    void fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [refresh]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const schedulePoll = () => {
      if (interval) clearInterval(interval);
      if (document.visibilityState === "visible") {
        interval = setInterval(() => void refresh(), 15_000);
      }
    };
    schedulePoll();
    document.addEventListener("visibilitychange", schedulePoll);
    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", schedulePoll);
    };
  }, [refresh]);

  useEffect(() => {
    let channel: BroadcastChannel | undefined;
    try {
      channel = new BroadcastChannel(AUTH_CHANNEL);
      channel.onmessage = (e) => {
        if (e?.data?.type === "logout") setUser(null);
      };
    } catch {
      // ignore
    }
    return () => channel?.close();
  }, []);

  const logout = useCallback(async () => {
    try {
      if (AUTH_BACKEND_URL) {
        await fetch(`${AUTH_BACKEND_URL}/auth/logout`, { method: "POST", credentials: "include" });
      }
    } catch {
      // ignore
    } finally {
      setUser(null);
    }
    try {
      new BroadcastChannel(AUTH_CHANNEL)?.postMessage({ type: "logout" });
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({ user, hydrated, refresh, logout }),
    [user, hydrated, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}


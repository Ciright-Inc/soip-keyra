"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_BACKEND_URL } from "@/lib/auth/auth-config";
import { useAuth } from "@/lib/auth/AuthProvider";

type Phase = "idle" | "otp_sent" | "verifying" | "error";

export default function SoipLoginPage() {
  const router = useRouter();
  const { user, hydrated, refresh } = useAuth();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string>("");

  const canCallBackend = Boolean(AUTH_BACKEND_URL);

  useEffect(() => {
    if (hydrated && user) {
      router.replace("/");
    }
  }, [hydrated, user, router]);

  const normalizedPhone = useMemo(() => phone.replace(/\s+/g, "").trim(), [phone]);

  async function postJson(path: string, body: unknown) {
    const res = await fetch(`${AUTH_BACKEND_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const contentType = res.headers.get("content-type") || "";
    const json = contentType.includes("application/json") ? await res.json().catch(() => ({})) : {};
    return { res, json: json as any };
  }

  const startOtp = async () => {
    setMessage("");
    setPhase("verifying");
    try {
      const { res, json } = await postJson("/auth/phone/start", { phone: normalizedPhone });
      if (!res.ok) {
        setPhase("error");
        setMessage(json?.error_description || json?.error || `Login start failed (HTTP ${res.status})`);
        return;
      }
      if (json?.quickLogin) {
        await refresh();
        router.replace("/");
        return;
      }
      if (json?.requiresOtp) {
        setPhase("otp_sent");
        setMessage(json?.message || "OTP sent.");
        return;
      }
      setPhase("error");
      setMessage("Unexpected response from auth server.");
    } catch (e) {
      setPhase("error");
      setMessage(e instanceof Error ? e.message : "Could not reach auth server.");
    }
  };

  const verifyOtp = async () => {
    setMessage("");
    setPhase("verifying");
    try {
      const { res, json } = await postJson("/auth/otp/verify", { phone: normalizedPhone, code: otp.trim() });
      if (!res.ok) {
        setPhase("error");
        setMessage(json?.error_description || json?.error || `OTP verify failed (HTTP ${res.status})`);
        return;
      }
      await refresh();
      router.replace("/");
    } catch (e) {
      setPhase("error");
      setMessage(e instanceof Error ? e.message : "Could not reach auth server.");
    }
  };

  const mockVerify = async () => {
    setMessage("");
    setPhase("verifying");
    try {
      const { res, json } = await postJson("/auth/mock/verify-mobile", { phone: normalizedPhone });
      if (!res.ok) {
        setPhase("error");
        setMessage(json?.error_description || json?.error || `Mock verify failed (HTTP ${res.status})`);
        return;
      }
      await refresh();
      router.replace("/");
    } catch (e) {
      setPhase("error");
      setMessage(e instanceof Error ? e.message : "Could not reach auth server.");
    }
  };

  return (
    <main className="verify-device-root">
      <div className="verify-device-card" style={{ maxWidth: 520 }}>
        <p style={{ color: "#cbd5e1", margin: 0, lineHeight: 1.5, fontWeight: 600 }}>SOIP sign in</p>
        <p style={{ color: "#94a3b8", marginTop: 8, lineHeight: 1.5 }}>
          Uses the same session as Get Started via <code>simsecure-auth-session</code>.
        </p>

        {!canCallBackend ? (
          <p style={{ color: "#fca5a5", marginTop: 12 }}>
            Missing <code>NEXT_PUBLIC_SIMSECURE_AUTH_BACKEND_URL</code>. Default should be <code>http://localhost:4000</code>.
          </p>
        ) : null}

        <label style={{ display: "block", marginTop: 14, color: "#cbd5e1" }}>
          Phone (E.164 preferred)
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+9190xxxxxx"
            style={{
              width: "100%",
              marginTop: 6,
              background: "rgba(2,6,23,.5)",
              border: "1px solid rgba(148,163,184,.25)",
              borderRadius: 10,
              padding: "10px 12px",
              color: "#e2e8f0",
            }}
          />
        </label>

        {phase === "otp_sent" ? (
          <label style={{ display: "block", marginTop: 12, color: "#cbd5e1" }}>
            OTP
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              style={{
                width: "100%",
                marginTop: 6,
                background: "rgba(2,6,23,.5)",
                border: "1px solid rgba(148,163,184,.25)",
                borderRadius: 10,
                padding: "10px 12px",
                color: "#e2e8f0",
              }}
            />
          </label>
        ) : null}

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={startOtp}
            disabled={!canCallBackend || phase === "verifying" || !normalizedPhone}
            className="hosted-login-copy"
            style={{ minWidth: 160 }}
          >
            Send OTP
          </button>
          <button
            type="button"
            onClick={verifyOtp}
            disabled={!canCallBackend || phase !== "otp_sent" || !otp.trim()}
            className="hosted-login-copy"
            style={{ minWidth: 160 }}
          >
            Verify OTP
          </button>
          <button
            type="button"
            onClick={mockVerify}
            disabled={!canCallBackend || phase === "verifying" || !normalizedPhone}
            className="hosted-login-copy"
            style={{ minWidth: 160 }}
          >
            Mock verify (local)
          </button>
        </div>

        {message ? (
          <p style={{ marginTop: 12, color: phase === "error" ? "#fca5a5" : "#cbd5e1", lineHeight: 1.5 }}>
            {message}
          </p>
        ) : null}

        <p style={{ marginTop: 14, color: "#94a3b8", lineHeight: 1.5, fontSize: 13 }}>
          If you get <code>503 otp_not_configured</code>, enable Twilio OR set <code>ENABLE_OTP_DEV_LOG=true</code> on the auth server.
          If you get <code>503 ipification_oauth_not_configured</code>, set <code>IPIFICATION_CLIENT_ID</code> and <code>IPIFICATION_REDIRECT_URI</code>.
        </p>
      </div>
    </main>
  );
}


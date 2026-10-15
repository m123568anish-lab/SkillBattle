"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      setMessage("Your password has been reset. You can sign in now.");
    } catch (requestError: any) {
      setError(requestError?.response?.data?.detail || "This reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout eyebrow="Account recovery" title="Choose a new password." description="Reset links expire quickly and can only be used once.">
      <div className="rounded-[30px] border border-white/10 bg-[#0b1220]/90 p-5 shadow-2xl sm:p-7">
        {message ? <div className="space-y-4"><h1 className="text-2xl font-black text-white">Password updated</h1><p className="text-slate-300">{message}</p><Link href="/login" className="font-semibold text-cyan-300">Continue to login</Link></div> : <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-medium text-slate-300" htmlFor="new-password">New password</label>
          <input id="new-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none focus:border-cyan-400/60" />
          <label className="block text-sm font-medium text-slate-300" htmlFor="confirm-password">Confirm password</label>
          <input id="confirm-password" type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none focus:border-cyan-400/60" />
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <button disabled={loading || !token} className="h-14 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 font-bold text-white disabled:opacity-50">{loading ? "Updating…" : "Reset password"}</button>
        </form>}
      </div>
    </AuthLayout>
  );
}

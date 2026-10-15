"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
    } finally {
      // The response is intentionally generic to prevent account enumeration.
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <AuthLayout eyebrow="Account recovery" title="Reset your password securely." description="We’ll send a short-lived reset link without revealing whether an account exists.">
      <div className="rounded-[30px] border border-white/10 bg-[#0b1220]/90 p-5 shadow-2xl sm:p-7">
        {sent ? (
          <div className="space-y-4 text-slate-300">
            <h1 className="text-2xl font-black text-white">Check your inbox</h1>
            <p>If the address matches an account, reset instructions are on their way.</p>
            <Link href="/login" className="inline-block font-semibold text-cyan-300">Return to login</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <label htmlFor="reset-email" className="block text-sm font-medium text-slate-300">Email address</label>
            <input id="reset-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none focus:border-cyan-400/60" />
            <button disabled={loading} className="h-14 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 font-bold text-white disabled:opacity-50">{loading ? "Sending…" : "Send reset link"}</button>
            <Link href="/login" className="block text-center text-sm text-slate-400 hover:text-white">Back to login</Link>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}

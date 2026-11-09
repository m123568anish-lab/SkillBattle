"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Loader2, Mail } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import { authClient } from "@/lib/auth/client";
import { toast } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
      setSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to request a password reset.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Reset your password securely."
      description="We'll send a cryptographic reset link to your verified address without exposing sensitive account metadata."
    >
      <div className="w-full">
        {sent ? (
          <div className="rounded-3xl border border-[var(--border-default,#202022)] bg-[var(--surface-elevated,#0D0D0D)] p-6 text-center sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--accent,#D8FF3E)]/30 bg-[var(--accent,#D8FF3E)]/10 text-[var(--accent-strong,#D8FF3E)]">
              <CheckCircle2 size={28} />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text-primary,#F5F5F5)]">
              Check your inbox
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary,#999999)]">
              If an account is associated with <span className="font-semibold text-white">{email}</span>, a secure password reset link has been dispatched.
            </p>
            <div className="mt-6 pt-2">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--accent,#D8FF3E)] px-6 text-sm font-bold text-black transition hover:brightness-105"
              >
                Return to sign in
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-7">
              <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent,#D8FF3E)]/25 bg-[var(--accent,#D8FF3E)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong,#D8FF3E)]">
                <KeyRound size={11} />
                Recovery
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary,#F5F5F5)] sm:text-4xl">
                Forgot password?
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary,#999999)]">
                Enter your account email to receive cryptographic password reset instructions.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="reset-email"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary,#999999)]"
                >
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoComplete="email"
                    disabled={loading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="engineer@qubira.com"
                    className="h-14 w-full rounded-2xl border border-[var(--border-default,#292929)] bg-[var(--surface-input,#141414)] px-4 text-sm font-medium text-[var(--text-primary,#F5F5F5)] transition-all placeholder:text-[var(--text-muted,#666666)] hover:border-[var(--border-focus,#444444)] focus:border-[var(--accent,#D8FF3E)] focus:bg-[#18181a] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#D8FF3E)]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="group relative flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent,#D8FF3E)] px-6 text-sm font-bold text-black transition-all duration-150 hover:brightness-105 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#D8FF3E)] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send reset link</span>
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-3 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary,#999999)] transition hover:text-[var(--text-primary,#F5F5F5)]"
                >
                  <ArrowLeft size={13} />
                  Back to login
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}

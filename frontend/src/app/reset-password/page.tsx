"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordStrength from "@/components/auth/PasswordStrength";
import { authClient } from "@/lib/auth/client";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.resetPassword({ token, newPassword: password });
      if (result.error) {
        throw new Error(result.error.message);
      }
      setMessage("Your password has been successfully reset. You can now access your account.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "This reset link is invalid, expired, or has already been used."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Choose a new password."
      description="Cryptographic reset links expire quickly and can only be used once to protect account integrity."
    >
      <div className="w-full">
        {message ? (
          <div className="rounded-3xl border border-[var(--border-default,#202022)] bg-[var(--surface-elevated,#0D0D0D)] p-6 text-center sm:p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--accent,#D8FF3E)]/30 bg-[var(--accent,#D8FF3E)]/10 text-[var(--accent-strong,#D8FF3E)]">
              <CheckCircle2 size={28} />
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text-primary,#F5F5F5)]">
              Password updated
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary,#999999)]">{message}</p>
            <div className="mt-6 pt-2">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--accent,#D8FF3E)] px-6 text-sm font-bold text-black transition hover:brightness-105"
              >
                <span>Continue to login</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-7">
              <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent,#D8FF3E)]/25 bg-[var(--accent,#D8FF3E)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong,#D8FF3E)]">
                <KeyRound size={11} />
                Security
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary,#F5F5F5)] sm:text-4xl">
                Reset password
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary,#999999)]">
                Enter your new secure password below to regain full account access.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4" noValidate>
              {/* New Password */}
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary,#999999)]"
                >
                  New password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="h-14 w-full rounded-2xl border border-[var(--border-default,#292929)] bg-[var(--surface-input,#141414)] pl-4 pr-12 text-sm font-medium text-[var(--text-primary,#F5F5F5)] transition-all placeholder:text-[var(--text-muted,#666666)] hover:border-[var(--border-focus,#444444)] focus:border-[var(--accent,#D8FF3E)] focus:bg-[#18181a] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#D8FF3E)]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[var(--text-muted,#777777)] transition hover:text-[var(--text-primary,#F5F5F5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#D8FF3E)]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary,#999999)]"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmation ? "text" : "password"}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    disabled={loading}
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="h-14 w-full rounded-2xl border border-[var(--border-default,#292929)] bg-[var(--surface-input,#141414)] pl-4 pr-12 text-sm font-medium text-[var(--text-primary,#F5F5F5)] transition-all placeholder:text-[var(--text-muted,#666666)] hover:border-[var(--border-focus,#444444)] focus:border-[var(--accent,#D8FF3E)] focus:bg-[#18181a] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#D8FF3E)]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmation((prev) => !prev)}
                    aria-label={showConfirmation ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[var(--text-muted,#777777)] transition hover:text-[var(--text-primary,#F5F5F5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#D8FF3E)]"
                  >
                    {showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-300">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || !password || !confirmation}
                  className="group relative flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent,#D8FF3E)] px-6 text-sm font-bold text-black transition-all duration-150 hover:brightness-105 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#D8FF3E)] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-black" />
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <>
                      <span>Reset password</span>
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

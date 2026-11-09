"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Loader2, Sparkles, ArrowRight, Lock } from "lucide-react";

import { loginSchema, type LoginFormData } from "@/lib/validation";
import { useLogin } from "@/hooks/use-login";
import { LegacyAccountPasswordRequiredError } from "@/store/authStore";
import { getPostLoginPath } from "@/lib/auth-routing";
import SocialLogin from "./SocialLogin";

export default function NeonLoginForm() {
  const router = useRouter();
  const { loading, signIn } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [needsLegacyPassword, setNeedsLegacyPassword] = useState(false);
  const [legacyPassword, setLegacyPassword] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    try {
      const result = await signIn(data, needsLegacyPassword ? legacyPassword : undefined);
      toast.success("Welcome back to Qubira.");
      router.replace(getPostLoginPath(result.user));
    } catch (error) {
      if (error instanceof LegacyAccountPasswordRequiredError) {
        setNeedsLegacyPassword(true);
        return;
      }
    }
  }

  const isPending = loading || isSubmitting;

  return (
    <div className="w-full">
      {/* Intro Header */}
      <div className="mb-8">
        <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent,#D8FF3E)]/25 bg-[var(--accent,#D8FF3E)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong,#D8FF3E)]">
          <Sparkles size={11} />
          Welcome back
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary,#F5F5F5)] sm:text-4xl">
          Welcome back.
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary,#999999)]">
          Your next achievement starts here.
        </p>
      </div>

      {/* Social Authentication (Google & GitHub) */}
      <SocialLogin mode="login" className="mb-6" />

      {/* Divider */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="w-full border-t border-[var(--border-default,#202022)]" />
        <span className="relative bg-[var(--surface-canvas,#050505)] px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted,#777777)]">
          or sign in with email
        </span>
      </div>

      {/* Email + Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email Address */}
        <div>
          <label
            htmlFor="login-email"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary,#999999)]"
          >
            Email address
          </label>
          <div className="relative">
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              disabled={isPending}
              {...register("email")}
              placeholder="engineer@qubira.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              className="h-14 w-full rounded-2xl border border-[var(--border-default,#292929)] bg-[var(--surface-input,#141414)] px-4 text-sm font-medium text-[var(--text-primary,#F5F5F5)] transition-all placeholder:text-[var(--text-muted,#666666)] hover:border-[var(--border-focus,#444444)] focus:border-[var(--accent,#D8FF3E)] focus:bg-[#18181a] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#D8FF3E)]/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          {errors.email && (
            <p id="login-email-error" role="alert" className="mt-1.5 text-xs font-medium text-rose-400">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary,#999999)]"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-[var(--text-secondary,#999999)] transition hover:text-[var(--accent-strong,#D8FF3E)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isPending}
              {...register("password")}
              placeholder="Enter your password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "login-password-error" : undefined}
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
          {errors.password && (
            <p id="login-password-error" role="alert" className="mt-1.5 text-xs font-medium text-rose-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Legacy Account Password Prompt */}
        {needsLegacyPassword && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <label
              htmlFor="legacy-password"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300"
            >
              <Lock size={13} />
              Previous Qubira password
            </label>
            <p className="mt-1 text-xs text-amber-200/80">
              Enter your previous password once to reconcile your historical account data.
            </p>
            <input
              id="legacy-password"
              type="password"
              autoComplete="current-password"
              value={legacyPassword}
              onChange={(e) => setLegacyPassword(e.target.value)}
              placeholder="Previous account password"
              className="mt-3 h-12 w-full rounded-xl border border-amber-500/40 bg-black/40 px-3.5 text-sm text-white placeholder:text-amber-200/40 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="group relative flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent,#D8FF3E)] px-6 text-sm font-bold text-black transition-all duration-150 hover:brightness-105 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#D8FF3E)] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-black" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Switch to Registration */}
      <div className="mt-7 text-center text-sm text-[var(--text-secondary,#999999)]">
        New to Qubira?{" "}
        <Link
          href="/register"
          className="font-bold text-[var(--accent-strong,#D8FF3E)] transition hover:underline"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Loader2, Sparkles, ArrowRight } from "lucide-react";

import PasswordStrength from "./PasswordStrength";
import SocialLogin from "./SocialLogin";
import { registerSchema, type RegisterFormData } from "@/lib/validation";
import { useRegister } from "@/hooks/use-register";

export default function NeonRegisterForm() {
  const router = useRouter();
  const { loading, signUp } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = useWatch({ control, name: "password" }) ?? "";
  const isPending = loading || isSubmitting;

  async function onSubmit(data: RegisterFormData) {
    try {
      await signUp(data);
      toast.success("Account created successfully. Welcome to Qubira!");
      router.replace("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create your account.");
    }
  }

  return (
    <div className="w-full">
      {/* Intro Header */}
      <div className="mb-7">
        <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent,#D8FF3E)]/25 bg-[var(--accent,#D8FF3E)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong,#D8FF3E)]">
          <Sparkles size={11} />
          Create Identity
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary,#F5F5F5)] sm:text-4xl">
          Create your account.
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary,#999999)]">
          Join the technical learning and real-time battle platform.
        </p>
      </div>

      {/* Social Registration */}
      <SocialLogin mode="register" className="mb-6" />

      {/* Divider */}
      <div className="relative mb-6 flex items-center justify-center">
        <div className="w-full border-t border-[var(--border-default,#202022)]" />
        <span className="relative bg-[var(--surface-canvas,#050505)] px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted,#777777)]">
          or register with email
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Full Name */}
        <div>
          <label
            htmlFor="register-name"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary,#999999)]"
          >
            Full name
          </label>
          <input
            id="register-name"
            autoComplete="name"
            disabled={isPending}
            {...register("name")}
            placeholder="Ada Lovelace"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "register-name-error" : undefined}
            className="h-14 w-full rounded-2xl border border-[var(--border-default,#292929)] bg-[var(--surface-input,#141414)] px-4 text-sm font-medium text-[var(--text-primary,#F5F5F5)] transition-all placeholder:text-[var(--text-muted,#666666)] hover:border-[var(--border-focus,#444444)] focus:border-[var(--accent,#D8FF3E)] focus:bg-[#18181a] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#D8FF3E)]/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.name && (
            <p id="register-name-error" role="alert" className="mt-1.5 text-xs font-medium text-rose-400">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label
            htmlFor="register-email"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary,#999999)]"
          >
            Email address
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            disabled={isPending}
            {...register("email")}
            placeholder="engineer@qubira.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "register-email-error" : undefined}
            className="h-14 w-full rounded-2xl border border-[var(--border-default,#292929)] bg-[var(--surface-input,#141414)] px-4 text-sm font-medium text-[var(--text-primary,#F5F5F5)] transition-all placeholder:text-[var(--text-muted,#666666)] hover:border-[var(--border-focus,#444444)] focus:border-[var(--accent,#D8FF3E)] focus:bg-[#18181a] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#D8FF3E)]/20 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.email && (
            <p id="register-email-error" role="alert" className="mt-1.5 text-xs font-medium text-rose-400">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="register-password"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary,#999999)]"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={isPending}
              {...register("password")}
              placeholder="Minimum 8 characters"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "register-password-error" : undefined}
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
          {errors.password && (
            <p id="register-password-error" role="alert" className="mt-1.5 text-xs font-medium text-rose-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="register-confirm-password"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary,#999999)]"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="register-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={isPending}
              {...register("confirmPassword")}
              placeholder="Re-enter your password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? "register-confirm-password-error" : undefined}
              className="h-14 w-full rounded-2xl border border-[var(--border-default,#292929)] bg-[var(--surface-input,#141414)] pl-4 pr-12 text-sm font-medium text-[var(--text-primary,#F5F5F5)] transition-all placeholder:text-[var(--text-muted,#666666)] hover:border-[var(--border-focus,#444444)] focus:border-[var(--accent,#D8FF3E)] focus:bg-[#18181a] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#D8FF3E)]/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[var(--text-muted,#777777)] transition hover:text-[var(--text-primary,#F5F5F5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#D8FF3E)]"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p id="register-confirm-password-error" role="alert" className="mt-1.5 text-xs font-medium text-rose-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Terms and Conditions Checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-3 text-xs text-[var(--text-secondary,#999999)]">
            <input
              type="checkbox"
              {...register("acceptTerms")}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border-default,#292929)] bg-[var(--surface-input,#141414)] accent-[var(--accent,#D8FF3E)] focus:ring-[var(--accent,#D8FF3E)]"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="text-[var(--accent-strong,#D8FF3E)] transition hover:underline">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[var(--accent-strong,#D8FF3E)] transition hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-rose-400">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

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
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create Qubira account</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Switch to Sign In */}
      <div className="mt-7 text-center text-sm text-[var(--text-secondary,#999999)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-bold text-[var(--accent-strong,#D8FF3E)] transition hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

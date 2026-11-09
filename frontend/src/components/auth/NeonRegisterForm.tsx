"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import GradientButton from "@/components/ui/gradient-button";
import PasswordStrength from "./PasswordStrength";
import { registerSchema, type RegisterFormData } from "@/lib/validation";
import { useRegister } from "@/hooks/use-register";

export default function NeonRegisterForm() {
  const router = useRouter();
  const { loading, signUp } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });
  const password = useWatch({ control, name: "password" }) ?? "";

  async function onSubmit(data: RegisterFormData) {
    try {
      await signUp(data);
      toast.success("Account created. You can now sign in.");
      router.replace("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create your account.");
    }
  }

  return (
    <div className="rounded-[30px] border border-white/10 bg-[#0b1220]/90 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.72)] ring-1 ring-white/5 backdrop-blur-xl sm:p-7">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Join Qubira</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">Create your account.</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="register-name" className="mb-2 block text-sm font-medium text-slate-300">Full name</label>
            <input id="register-name" autoComplete="name" {...register("name")} placeholder="Your full name" className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15" />
            {errors.name && <p role="alert" className="mt-2 text-sm text-red-400">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="register-email" className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
            <input id="register-email" type="email" autoComplete="email" {...register("email")} placeholder="name@example.com" className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15" />
            {errors.email && <p role="alert" className="mt-2 text-sm text-red-400">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="register-password" className="mb-2 block text-sm font-medium text-slate-300">Password</label>
            <input id="register-password" type={showPassword ? "text" : "password"} autoComplete="new-password" {...register("password")} placeholder="Create a secure password" className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15" />
            <PasswordStrength password={password} />
            {errors.password && <p role="alert" className="mt-2 text-sm text-red-400">{errors.password.message}</p>}
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="mt-2 text-xs text-cyan-300 hover:text-cyan-200">
              {showPassword ? "Hide password" : "Show password"}
            </button>
          </div>

          <div>
            <label htmlFor="register-confirm-password" className="mb-2 block text-sm font-medium text-slate-300">Confirm password</label>
            <input id="register-confirm-password" type="password" autoComplete="new-password" {...register("confirmPassword")} aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? "register-confirm-password-error" : undefined} placeholder="Re-enter your password" className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15" />
            {errors.confirmPassword && <p id="register-confirm-password-error" role="alert" className="mt-2 text-sm text-red-400">{errors.confirmPassword.message}</p>}
          </div>

          <label className="flex items-start gap-3 text-sm text-slate-300">
            <input className="mt-1 accent-cyan-400" type="checkbox" {...register("acceptTerms")} />
            <span>I agree to the <Link href="/terms" className="text-cyan-300 hover:text-cyan-200">Terms &amp; Conditions</Link></span>
          </label>
          {errors.acceptTerms && <p role="alert" className="text-sm text-red-400">{errors.acceptTerms.message}</p>}

          <GradientButton loading={loading} fullWidth type="submit">
            {loading ? "Creating account..." : "Create Qubira account"}
          </GradientButton>
      </form>

      <p className="mt-7 text-center text-sm text-slate-400">
        Already have an account?
        <Link href="/login" className="ml-2 font-semibold text-cyan-300 transition hover:text-cyan-200">Sign in</Link>
      </p>
    </div>
  );
}

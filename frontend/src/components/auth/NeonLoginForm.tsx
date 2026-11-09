"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import { loginSchema, type LoginFormData } from "@/lib/validation";
import { useLogin } from "@/hooks/use-login";
import { LegacyAccountPasswordRequiredError } from "@/store/authStore";
import { getPostLoginPath } from "@/lib/auth-routing";

export default function NeonLoginForm() {
  const router = useRouter();
  const { loading, signIn } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [needsLegacyPassword, setNeedsLegacyPassword] = useState(false);
  const [legacyPassword, setLegacyPassword] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
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

  return (
    <div className="rounded-[30px] border border-white/10 bg-[#0b1220]/90 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.72)] ring-1 ring-white/5 backdrop-blur-xl sm:p-7">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Returning user</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">Welcome back.</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
          <input id="login-email" type="email" autoComplete="email" {...register("email")} className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15" placeholder="name@example.com" />
          {errors.email && <p role="alert" className="mt-2 text-sm text-red-400">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-slate-300">Password</label>
          <input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" {...register("password")} className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15" placeholder="Enter your password" />
          {errors.password && <p role="alert" className="mt-2 text-sm text-red-400">{errors.password.message}</p>}
          <div className="mt-2 flex justify-between text-xs">
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-cyan-300 hover:text-cyan-200">
              {showPassword ? "Hide password" : "Show password"}
            </button>
            <Link href="/forgot-password" className="text-slate-400 hover:text-white">Forgot password?</Link>
          </div>
        </div>

        {needsLegacyPassword && (
          <div>
            <label htmlFor="legacy-password" className="mb-2 block text-sm font-medium text-slate-300">
              Previous Qubira password
            </label>
            <p className="mb-2 text-xs text-slate-400">
              Enter the password for your older Qubira account once to connect it. Email verification is not required.
            </p>
            <input
              id="legacy-password"
              type="password"
              autoComplete="current-password"
              value={legacyPassword}
              onChange={(event) => setLegacyPassword(event.target.value)}
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15"
              placeholder="Previous account password"
            />
          </div>
        )}

        <button type="submit" disabled={loading} className="h-14 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-400">
        New to Qubira?
        <Link href="/register" className="ml-2 font-semibold text-cyan-300 transition hover:text-cyan-200">Create an account</Link>
      </p>
    </div>
  );
}

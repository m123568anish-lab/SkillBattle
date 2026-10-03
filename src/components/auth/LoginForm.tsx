"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { BriefcaseBusiness, Building2, Eye, EyeOff, GraduationCap, Lock, Mail } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import GradientButton from "@/components/ui/gradient-button";
import { loginSchema, LoginFormData } from "@/lib/validation";

import { useLogin } from "@/hooks/use-login";
import { getPostLoginPath } from "@/lib/auth-routing";

const roleOptions = [
  { role: "STUDENT", label: "Student", detail: "Learn • Practice • Battle", Icon: GraduationCap },
  { role: "COLLEGE", label: "College", detail: "Assess • Manage • Place", Icon: Building2 },
  { role: "COMPANY", label: "Company", detail: "Discover • Hire • Grow", Icon: BriefcaseBusiness },
] as const;

export default function LoginForm() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<(typeof roleOptions)[number]["role"]>("STUDENT");
  const [showPassword, setShowPassword] = useState(false);
  const { loading, signIn } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    try {
      const result = await signIn({ ...data, role: selectedRole });
      if (!result?.tokens?.access_token) {
        throw new Error("No access token received.");
      }
      toast.success("Welcome back to SkillBattle");
      router.replace(getPostLoginPath(result.user));
    } catch (error: unknown) {
      console.error("Login submission error:", error);
    }
  }

  return (
    <div className="rounded-[30px] border border-white/10 bg-[#0b1220]/90 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.72)] ring-1 ring-white/5 backdrop-blur-xl sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Returning user</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">Welcome back.</h1>
        </div>
        <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
          Secure
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Choose your SkillBattle path</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {roleOptions.map(({ role, label, detail, Icon }) => (
            <button
              key={role}
              type="button"
              aria-pressed={selectedRole === role}
              onClick={() => setSelectedRole(role)}
              className={`flex min-h-[92px] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-center transition ${selectedRole === role ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-50 shadow-[0_0_20px_rgba(34,211,238,0.15)]" : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/15 hover:bg-white/[0.04]"}`}
            >
              <Icon size={18} aria-hidden="true" />
              <span className="text-sm font-bold">{label}</span>
              <span className="text-[10px] text-slate-400">{detail}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Or continue with</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <button type="button" className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70">
          <span className="text-base">G</span>
          Google
        </button>
        <button type="button" className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70">
          <span className="text-base">⌘</span>
          GitHub
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-3.5 text-slate-500" size={18} />
            <input
              id="login-email"
              autoComplete="email"
              {...register("email")}
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.02] pl-12 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15"
              placeholder="name@example.com"
            />
          </div>
          {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-slate-300">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-3.5 text-slate-500" size={18} />
            <input
              id="login-password"
              autoComplete="current-password"
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.02] pl-12 pr-12 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15"
              placeholder="Enter your password"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-slate-500 transition hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <label className="flex items-center gap-2 text-slate-300">
            <input type="checkbox" className="accent-cyan-400" />
            Remember me
          </label>
          <Link href="/forgot-password" className="font-medium text-cyan-300 transition hover:text-cyan-200">
            Forgot password?
          </Link>
        </div>

        <GradientButton fullWidth loading={loading} type="submit">
          {loading ? "Signing in..." : "Enter SkillBattle"}
        </GradientButton>
      </form>

      <p className="mt-7 text-center text-sm text-slate-400">
        New here?
        <Link href="/register" className="ml-2 font-semibold text-cyan-300 transition hover:text-cyan-200">
          Create your account
        </Link>
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "react-hot-toast";

import GradientButton from "@/components/ui/gradient-button";
const SocialLogin = dynamic(() => import("./SocialLogin"), {
  ssr: false,
});

import {
  loginSchema,
  LoginFormData,
} from "@/lib/validation";

import { useLogin } from "@/hooks/use-login";

export default function LoginForm() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<"STUDENT" | "COLLEGE" | "COMPANY">("STUDENT");
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
      const loginPayload = { ...data, role: selectedRole };
      const result = await signIn(loginPayload);

      if (!result?.tokens?.access_token) {
        throw new Error("No access token received.");
      }

      toast.success("Welcome back!");

      const role = (result.user?.role || "user").toLowerCase();
      if (
        role === "college" ||
        role === "college_admin" ||
        role === "placement_officer" ||
        role === "faculty"
      ) {
        router.replace("/college/dashboard");
      } else if (
        role === "company" ||
        role === "company_admin" ||
        role === "recruiter"
      ) {
        router.replace("/company/dashboard");
      } else {
        if (result.user?.onboarding_completed === false) {
          router.replace("/onboarding");
        } else {
          router.replace("/student/dashboard");
        }
      }
    } catch (error: any) {
      console.error(error);

      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Unable to login.";

      toast.error(message);
    }
  }

  return (
    <>
      {/* Account Role Selector */}
      <div className="mb-6">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
          Choose Account Type
        </label>
        <div className="grid grid-cols-3 gap-3">
          {/* Student Card */}
          <button
            type="button"
            onClick={() => setSelectedRole("STUDENT")}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
              selectedRole === "STUDENT"
                ? "border-cyan-500 bg-gradient-to-b from-cyan-500/20 to-cyan-500/5 text-cyan-300 shadow-lg shadow-cyan-500/20"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            <span className="text-2xl mb-1">🎓</span>
            <span className="text-sm font-bold">Student</span>
            <span className="text-[10px] text-slate-400">Learning & Arena</span>
          </button>

          {/* College Card */}
          <button
            type="button"
            onClick={() => setSelectedRole("COLLEGE")}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
              selectedRole === "COLLEGE"
                ? "border-cyan-500 bg-gradient-to-b from-cyan-500/20 to-cyan-500/5 text-cyan-300 shadow-lg shadow-cyan-500/20"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            <span className="text-2xl mb-1">🏫</span>
            <span className="text-sm font-bold">College</span>
            <span className="text-[10px] text-slate-400">Placement Cell</span>
          </button>

          {/* Company Card */}
          <button
            type="button"
            onClick={() => setSelectedRole("COMPANY")}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
              selectedRole === "COMPANY"
                ? "border-cyan-500 bg-gradient-to-b from-cyan-500/20 to-cyan-500/5 text-cyan-300 shadow-lg shadow-cyan-500/20"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            <span className="text-2xl mb-1">🏢</span>
            <span className="text-sm font-bold">Company</span>
            <span className="text-[10px] text-slate-400">Recruiter</span>
          </button>
        </div>
      </div>

      <SocialLogin />

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />

        <span className="text-sm text-slate-400">
          OR
        </span>

        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
        {/* Email */}

        <div>
          <label className="mb-2 block text-sm text-slate-300">
            Email
          </label>

          <div className="relative">
            <Mail className="absolute left-4 top-4 text-slate-500" />

            <input
              {...register("email")}
              className="
                h-14
                w-full
                rounded-xl
                border
                border-white/10
                bg-white/5
                pl-12
                pr-4
                text-white
                outline-none
                transition
                focus:border-cyan-500
              "
              placeholder="Enter your email"
            />
          </div>

          {errors.email && (
            <p className="mt-2 text-sm text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}

        <div>
          <label className="mb-2 block text-sm text-slate-300">
            Password
          </label>

          <div className="relative">
            <Lock className="absolute left-4 top-4 text-slate-500" />

            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              className="
                h-14
                w-full
                rounded-xl
                border
                border-white/10
                bg-white/5
                pl-12
                pr-14
                text-white
                outline-none
                transition
                focus:border-cyan-500
              "
              placeholder="Enter your password"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              className="absolute right-4 top-4 text-slate-500"
            >
              {showPassword ? (
                <EyeOff size={20} />
              ) : (
                <Eye size={20} />
              )}
            </button>
          </div>

          {errors.password && (
            <p className="mt-2 text-sm text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember */}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" />

            Remember Me
          </label>

          <Link
            href="/forgot-password"
            className="text-sm text-cyan-400 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Login */}

        <GradientButton
          fullWidth
          loading={loading}
        >
          Login
        </GradientButton>
      </form>

      <p className="mt-8 text-center text-slate-400">
        Don't have an account?

        <Link
          href="/register"
          className="ml-2 text-cyan-400 hover:underline"
        >
          Register
        </Link>
      </p>
    </>
  );
}
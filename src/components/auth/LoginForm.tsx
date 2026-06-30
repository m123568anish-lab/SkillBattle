"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";

import GradientButton from "@/components/ui/gradient-button";
import SocialLogin from "./SocialLogin";

import {
  loginSchema,
  LoginFormData,
} from "@/lib/validation";

import { useLogin } from "@/hooks/use-login";

export default function LoginForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] =
    useState(false);

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
      await signIn(data);

      toast.success("Login successful");

      router.push("/dashboard");
    } catch (error) {
      console.error(error);

      toast.error("Invalid email or password");
    }
  }

  return (
    <>
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
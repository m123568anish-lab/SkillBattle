"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import GradientButton from "@/components/ui/gradient-button";

import AvatarUpload from "./AvatarUpload";
import PasswordStrength from "./PasswordStrength";

import {
  registerSchema,
  RegisterFormData,
} from "@/lib/validation";

import { useRegister } from "@/hooks/use-register";

export default function RegisterForm() {
  const router = useRouter();

  const { loading, signUp } = useRegister();

  const [showPassword, setShowPassword] =
    useState(false);

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password") || "";

  async function onSubmit(
    data: RegisterFormData
  ) {
    try {
      await signUp(data);

      toast.success(
        "Registration successful!"
      );

      router.push("/dashboard");
    } catch {
      toast.error(
        "Registration failed."
      );
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <AvatarUpload />

      <input
        {...register("name")}
        placeholder="Full Name"
        className="h-14 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
      />

      {errors.name && (
        <p className="text-red-400">
          {errors.name.message}
        </p>
      )}

      <input
        {...register("email")}
        placeholder="Email"
        className="h-14 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
      />

      {errors.email && (
        <p className="text-red-400">
          {errors.email.message}
        </p>
      )}

      <div className="relative">
        <input
          type={
            showPassword
              ? "text"
              : "password"
          }
          {...register("password")}
          placeholder="Password"
          className="h-14 w-full rounded-xl border border-white/10 bg-white/5 px-4 pr-12 text-white"
        />

        <button
          type="button"
          onClick={() =>
            setShowPassword(!showPassword)
          }
          className="absolute right-4 top-4"
        >
          {showPassword ? (
            <EyeOff />
          ) : (
            <Eye />
          )}
        </button>
      </div>

      <PasswordStrength
        password={password}
      />

      {errors.password && (
        <p className="text-red-400">
          {errors.password.message}
        </p>
      )}

      <input
        type="password"
        {...register("confirmPassword")}
        placeholder="Confirm Password"
        className="h-14 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white"
      />

      {errors.confirmPassword && (
        <p className="text-red-400">
          {errors.confirmPassword.message}
        </p>
      )}

      <label className="flex items-center gap-3">

        <input
          type="checkbox"
          {...register("acceptTerms")}
        />

        <span className="text-slate-300">
          I agree to Terms &
          Conditions
        </span>

      </label>

      {errors.acceptTerms && (
        <p className="text-red-400">
          {errors.acceptTerms.message}
        </p>
      )}

      <GradientButton
        loading={loading}
        fullWidth
      >
        Create Account
      </GradientButton>

      <p className="text-center text-slate-400">
        Already have an account?

        <Link
          href="/login"
          className="ml-2 text-cyan-400"
        >
          Login
        </Link>

      </p>
    </form>
  );
}
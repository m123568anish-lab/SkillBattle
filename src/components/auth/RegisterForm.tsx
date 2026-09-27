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
import { useLogin } from "@/hooks/use-login";
import { AI_AVATARS } from "@/lib/avatars";

export default function RegisterForm() {
  const router = useRouter();

  const { loading, signUp } = useRegister();
  const { signIn } = useLogin();

  const [showPassword, setShowPassword] =
    useState(false);
  const [selectedAccountType, setSelectedAccountType] =
    useState<"STUDENT" | "COLLEGE" | "COMPANY">("STUDENT");
  const [avatar, setAvatar] = useState(AI_AVATARS[0].url);

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
      await signUp({ ...data, avatar, account_type: selectedAccountType });

      try {
        await signIn({ email: data.email, password: data.password });
        toast.success("Account created! Let's set up your profile.");
        router.replace("/onboarding");
      } catch {
        toast.success("Account created successfully! Please log in.");
        router.replace("/login");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Registration failed.";
      toast.error(msg);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <div className="mb-6">
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
          Choose your account
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "STUDENT", label: "Student", icon: "🎓", sub: "Learn & compete" },
            { key: "COLLEGE", label: "College", icon: "🏫", sub: "Manage students" },
            { key: "COMPANY", label: "Company", icon: "🏢", sub: "Hire talent" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSelectedAccountType(option.key as "STUDENT" | "COLLEGE" | "COMPANY")}
              className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition ${
                selectedAccountType === option.key
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-200"
                  : "border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              <span className="mb-1 text-2xl">{option.icon}</span>
              <span className="text-sm font-bold">{option.label}</span>
              <span className="text-[10px] text-slate-400">{option.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <AvatarUpload value={avatar} onChange={setAvatar} />

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
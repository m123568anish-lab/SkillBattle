"use client";

import Link from "next/link";
import { Mail, Lock } from "lucide-react";

import GradientButton from "@/components/ui/gradient-button";
import SocialLogin from "./SocialLogin";

export default function LoginForm() {
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

      <form className="space-y-5">

        <div>

          <label className="mb-2 block text-sm text-slate-300">
            Email
          </label>

          <div className="relative">

            <Mail className="absolute left-4 top-4 text-slate-500" />

            <input
              className="h-14 w-full rounded-xl border border-white/10 bg-white/5 pl-12 text-white"
              placeholder="Enter email"
            />

          </div>

        </div>

        <div>

          <label className="mb-2 block text-sm text-slate-300">
            Password
          </label>

          <div className="relative">

            <Lock className="absolute left-4 top-4 text-slate-500" />

            <input
              type="password"
              className="h-14 w-full rounded-xl border border-white/10 bg-white/5 pl-12 text-white"
              placeholder="Password"
            />

          </div>

        </div>

        <div className="flex items-center justify-between">

          <label className="flex items-center gap-2 text-sm text-slate-300">

            <input type="checkbox" />

            Remember me

          </label>

          <Link
            href="/forgot-password"
            className="text-cyan-400"
          >
            Forgot?
          </Link>

        </div>

        <GradientButton
          fullWidth
        >
          Login
        </GradientButton>

      </form>

      <p className="mt-6 text-center text-slate-400">

        Don't have an account?

        <Link
          href="/register"
          className="ml-2 text-cyan-400"
        >
          Register
        </Link>

      </p>

    </>
  );
}
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import SocialLogin from "./SocialLogin";

export default function RegisterForm() {
  return (
    <div className="space-y-5">
      <SocialLogin />

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
        Create your account to join coding battles and track your progress.
      </div>

      <Button className="w-full bg-violet-600 hover:bg-violet-700">
        Create Account
      </Button>

      <p className="text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-cyan-400 hover:text-cyan-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}

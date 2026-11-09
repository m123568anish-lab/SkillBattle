"use client";

import Link from "next/link";
import { Mail, Sparkles } from "lucide-react";
import OTPForm from "./OTPForm";

export default function VerifyEmailCard() {
  return (
    <div className="w-full">
      {/* Intro Header */}
      <div className="mb-7 text-left">
        <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent,#D8FF3E)]/25 bg-[var(--accent,#D8FF3E)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-strong,#D8FF3E)]">
          <Sparkles size={11} />
          Verification
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary,#F5F5F5)] sm:text-4xl">
          Check your inbox.
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary,#999999)]">
          We’ve dispatched a 6-digit confirmation code to your email address. Enter it below to unlock your workspace.
        </p>
      </div>

      {/* 6-Digit OTP Form Component */}
      <OTPForm />

      {/* Alternative Action */}
      <div className="mt-8 border-t border-[var(--border-default,#202022)] pt-6 text-center text-xs text-[var(--text-muted,#777777)]">
        Already completed verification in another tab?{" "}
        <Link href="/login" className="font-bold text-[var(--accent-strong,#D8FF3E)] hover:underline">
          Return to sign in
        </Link>
      </div>
    </div>
  );
}

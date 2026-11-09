"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { ArrowLeft, ArrowRight, Loader2, RefreshCw, ShieldCheck } from "lucide-react";

import VerificationSuccess from "./VerificationSuccess";
import { useAuthStore } from "@/store/authStore";
import { getPostLoginPath } from "@/lib/auth-routing";
import { verifyOTP, resendOTP } from "@/services/otp.service";

const OTP_LENGTH = 6;

export default function OTPForm() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [seconds, setSeconds] = useState(60);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown Timer
  useEffect(() => {
    if (seconds === 0) return;
    const timer = setTimeout(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  // Auto Verify when 6 digits are entered
  useEffect(() => {
    const code = otp.join("");
    if (code.length === OTP_LENGTH && !otp.includes("") && !loading && !verified) {
      void handleVerify();
    }
  }, [otp]);

  function handleChange(value: string, index: number) {
    setErrorMessage("");
    if (!/^\d*$/.test(value)) return;

    const digit = value.slice(-1);
    const updated = [...otp];
    updated[index] = digit;
    setOtp(updated);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    setErrorMessage("");
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    const updated = [...otp];
    pasted.split("").forEach((digit, index) => {
      updated[index] = digit;
    });
    setOtp(updated);

    const targetFocus = Math.min(pasted.length, OTP_LENGTH) - 1;
    inputRefs.current[targetFocus]?.focus();
  }

  async function handleVerify() {
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setErrorMessage("Please enter all 6 digits.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      await verifyOTP(code);
      await useAuthStore.getState().loadUser();
      const user = useAuthStore.getState().user;

      setVerified(true);
      toast.success("Email verified successfully 🎉");

      setTimeout(() => {
        router.push(user ? getPostLoginPath(user) : "/login");
      }, 2000);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Invalid or expired verification code.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (seconds > 0 || resending) return;
    try {
      setResending(true);
      setErrorMessage("");
      await resendOTP();
      toast.success("A new verification code has been dispatched.");
      setSeconds(60);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  if (verified) {
    return <VerificationSuccess />;
  }

  return (
    <div className="w-full">
      {/* 6 OTP Inputs */}
      <div className="mb-6">
        <label className="mb-3 block text-center text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary,#999999)]">
          Security code
        </label>
        <div className="flex justify-center gap-2 sm:gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              value={digit}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={1}
              disabled={loading}
              onPaste={handlePaste}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              aria-label={`Digit ${index + 1} of 6`}
              className="h-14 w-12 rounded-2xl border border-[var(--border-default,#292929)] bg-[var(--surface-input,#141414)] text-center font-mono text-2xl font-black text-[var(--text-primary,#F5F5F5)] transition-all placeholder:text-[var(--text-muted,#555555)] hover:border-[var(--border-focus,#444444)] focus:border-[var(--accent,#D8FF3E)] focus:bg-[#18181a] focus:outline-none focus:ring-2 focus:ring-[var(--accent,#D8FF3E)]/25 disabled:opacity-50 sm:h-16 sm:w-14"
            />
          ))}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div role="alert" className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center text-xs font-medium text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* Verify Button */}
      <button
        type="button"
        onClick={handleVerify}
        disabled={loading || otp.includes("")}
        className="group relative flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent,#D8FF3E)] px-6 text-sm font-bold text-black transition-all duration-150 hover:brightness-105 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent,#D8FF3E)] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-black" />
            <span>Verifying code...</span>
          </>
        ) : (
          <>
            <span>Verify &amp; Continue</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>

      {/* Footer Controls: Resend & Change email */}
      <div className="mt-6 flex flex-col items-center justify-between gap-3 text-xs text-[var(--text-secondary,#999999)] sm:flex-row">
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 transition hover:text-[var(--text-primary,#F5F5F5)] hover:underline"
        >
          <ArrowLeft size={13} />
          Change email address
        </Link>

        {seconds > 0 ? (
          <span className="font-medium text-[var(--text-muted,#777777)]">
            Resend available in <span className="font-mono text-white">{seconds}s</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-1.5 font-bold text-[var(--accent-strong,#D8FF3E)] transition hover:underline disabled:opacity-50"
          >
            {resending ? <RefreshCw size={12} className="animate-spin" /> : null}
            Resend security code
          </button>
        )}
      </div>
    </div>
  );
}

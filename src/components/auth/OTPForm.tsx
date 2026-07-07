"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import GradientButton from "@/components/ui/gradient-button";
import VerificationSuccess from "./VerificationSuccess";

import {
  verifyOTP,
  resendOTP,
} from "@/services/otp.service";

const OTP_LENGTH = 6;

export default function OTPForm() {
  const router = useRouter();

  const [otp, setOtp] = useState<string[]>(
    Array(OTP_LENGTH).fill("")
  );

  const [loading, setLoading] = useState(false);

  const [verified, setVerified] = useState(false);

  const [seconds, setSeconds] = useState(60);

  const inputRefs = useRef<Array<HTMLInputElement | null>>(
    []
  );

  // Countdown Timer
  useEffect(() => {
    if (seconds === 0) return;

    const timer = setTimeout(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [seconds]);

  // Auto Verify
  useEffect(() => {
    const code = otp.join("");

    if (
      code.length === OTP_LENGTH &&
      !otp.includes("") &&
      !loading &&
      !verified
    ) {
      handleVerify();
    }
  }, [otp]);

  function handleChange(
    value: string,
    index: number
  ) {
    if (!/^\d*$/.test(value)) return;

    const digit = value.slice(-1);

    const updated = [...otp];

    updated[index] = digit;

    setOtp(updated);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) {
    if (
      e.key === "Backspace" &&
      otp[index] === "" &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (
      e.key === "ArrowRight" &&
      index < OTP_LENGTH - 1
    ) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(
    e: React.ClipboardEvent<HTMLInputElement>
  ) {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    const updated = [...otp];

    pasted.split("").forEach((digit, index) => {
      updated[index] = digit;
    });

    setOtp(updated);

    inputRefs.current[
      Math.min(pasted.length, OTP_LENGTH) - 1
    ]?.focus();
  }

  async function handleVerify() {
    const code = otp.join("");

    if (code.length !== OTP_LENGTH) {
      return;
    }

    try {
      setLoading(true);

      await verifyOTP(code);

      setVerified(true);

      toast.success("Email verified successfully 🎉");

      setTimeout(() => {
        router.push("/onboarding");
      }, 2200);
    } catch (error) {
      console.error(error);

      toast.error("Invalid verification code");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await resendOTP();

      toast.success("OTP sent again");

      setSeconds(60);

      setOtp(Array(OTP_LENGTH).fill(""));

      inputRefs.current[0]?.focus();
    } catch (error) {
      console.error(error);

      toast.error("Failed to resend OTP");
    }
  }

  if (verified) {
    return <VerificationSuccess />;
  }

  return (
    <div className="space-y-8">

      {/* OTP Inputs */}

      <div className="flex justify-center gap-3">

        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            value={digit}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            onPaste={handlePaste}
            onChange={(e) =>
              handleChange(
                e.target.value,
                index
              )
            }
            onKeyDown={(e) =>
              handleKeyDown(e, index)
            }
            className="
              h-14
              w-14
              rounded-xl
              border
              border-white/10
              bg-white/5
              text-center
              text-2xl
              font-bold
              text-white
              outline-none
              transition-all
              duration-300
              focus:border-cyan-500
              focus:ring-2
              focus:ring-cyan-500/30
            "
          />
        ))}

      </div>

      {/* Verify */}

      <GradientButton
        fullWidth
        loading={loading}
        onClick={handleVerify}
      >
        Verify Email
      </GradientButton>

      {/* Footer */}

      <div className="flex items-center justify-between text-sm">

        <Link
          href="/register"
          className="text-cyan-400 hover:underline"
        >
          Change Email
        </Link>

        {seconds > 0 ? (
          <span className="text-slate-400">
            Resend in {seconds}s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-cyan-400 hover:underline"
          >
            Resend OTP
          </button>
        )}

      </div>

    </div>
  );
}
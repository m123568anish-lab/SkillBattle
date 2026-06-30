"use client";

import { useRef, useState } from "react";

import GradientButton from "@/components/ui/gradient-button";

const OTP_LENGTH = 6;

export default function OTPForm() {
  const [otp, setOtp] = useState(
    Array(OTP_LENGTH).fill("")
  );

  const inputRefs = useRef<
    Array<HTMLInputElement | null>
  >([]);

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

    if (
      e.key === "ArrowLeft" &&
      index > 0
    ) {
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

    const lastIndex = Math.min(
      pasted.length,
      OTP_LENGTH
    );

    inputRefs.current[lastIndex - 1]?.focus();
  }

  function handleVerify() {
    const code = otp.join("");

    console.log("OTP:", code);

    // API call in next step
  }

  return (
    <div className="space-y-8">

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
              handleKeyDown(
                e,
                index
              )
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
              focus:border-cyan-400
              focus:ring-2
              focus:ring-cyan-400/30
            "
          />
        ))}

      </div>

      <GradientButton
        fullWidth
        onClick={handleVerify}
      >
        Verify Email
      </GradientButton>

    </div>
  );
}
"use client";

import AuthCard from "./AuthCard";
import OTPForm from "./OTPForm";

export default function VerifyEmailCard() {
  return (
    <AuthCard
      title="Verify Email 📧"
      subtitle="We've sent a 6-digit verification code to your email."
    >
      <OTPForm />
    </AuthCard>
  );
}
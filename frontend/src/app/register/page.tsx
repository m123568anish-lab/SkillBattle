import { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import NeonRegisterForm from "@/components/auth/NeonRegisterForm";

export default function RegisterPage() {
  return (
    <AuthLayout
      eyebrow="New to Qubira"
      title="Create your Qubira identity."
      description="Create an account with your email address and a password."
    >
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/[0.03]" />}>
        <NeonRegisterForm />
      </Suspense>
    </AuthLayout>
  );
}

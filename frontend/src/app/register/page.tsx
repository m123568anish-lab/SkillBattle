import { Suspense } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthLayout
      eyebrow="New to SkillBattle"
      title="Create your SkillBattle identity."
      description="Choose the path that matches how you learn, teach, or hire, then complete only the details needed right now."
    >
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/[0.03]" />}>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
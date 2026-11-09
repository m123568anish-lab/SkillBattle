import AuthLayout from "@/components/auth/AuthLayout";
import VerifyEmailCard from "@/components/auth/VerifyEmailCard";

export default function VerifyEmailPage() {
  return (
    <AuthLayout
      eyebrow="Security Verification"
      title="Verify your Qubira identity."
      description="Protect your workspace, rank standing, and competitive match history with cryptographic email verification."
    >
      <VerifyEmailCard />
    </AuthLayout>
  );
}

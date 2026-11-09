import AuthLayout from "@/components/auth/AuthLayout";
import NeonLoginForm from "@/components/auth/NeonLoginForm";

export default function LoginPage() {
  return (
    <AuthLayout
      eyebrow="Returning user"
      title="Login to your Qubira workspace."
      description="Sign in securely with your email and password."
    >
      <NeonLoginForm />
    </AuthLayout>
  );
}

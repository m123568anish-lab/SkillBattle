import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout
      eyebrow="Returning user"
      title="Login to your Qubira workspace."
      description="Your settings, learning progress, and role context are restored after secure authentication."
    >
      <LoginForm />
    </AuthLayout>
  );
}

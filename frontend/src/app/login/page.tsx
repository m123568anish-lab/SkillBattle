import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout
      eyebrow="Returning user"
      title="Login to your SkillBattle workspace."
      description="Your settings, progress, and role context are restored after secure authentication."
    >
      <LoginForm />
    </AuthLayout>
  );
}
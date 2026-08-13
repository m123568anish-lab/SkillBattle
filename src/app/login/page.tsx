import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthCard
        title="Welcome Back 👋"
        subtitle="Login to continue your SkillBattle journey."
      >
        <LoginForm />
      </AuthCard>
    </AuthLayout>
  );
}
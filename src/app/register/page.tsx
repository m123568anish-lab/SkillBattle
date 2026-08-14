import AuthLayout from "@/components/auth/AuthLayout";
import AuthCard from "@/components/auth/AuthCard";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthLayout>
      <AuthCard
        title="Create Account 🚀"
        subtitle="Join SkillBattle and start your placement journey."
      >
        <RegisterForm />
      </AuthCard>
    </AuthLayout>
  );
}
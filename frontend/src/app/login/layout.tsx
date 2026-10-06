import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to SkillBattle to continue your student, college, company, or platform administrator workflow.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a SkillBattle account for student learning, college workflows, or verified company hiring.",
  alternates: { canonical: "/register" },
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
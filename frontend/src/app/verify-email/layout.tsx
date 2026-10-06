import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Verify the email address associated with your SkillBattle account.",
  alternates: { canonical: "/verify-email" },
  robots: { index: false, follow: false },
};

export default function VerifyEmailLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
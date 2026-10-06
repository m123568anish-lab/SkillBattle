import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

export const metadata: Metadata = {
  title: "SkillBattle | AI Coding Battles",
  description: "Practice real coding problems, compete in supported battles, develop evidence-backed skills, and connect learning to assessment and hiring workflows.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "SkillBattle | AI Coding Battles",
    description: "Practice coding, build verified skill evidence, and connect learning to assessment and hiring workflows.",
    url: "/",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "SkillBattle coding practice, battles, and hiring platform" }],
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
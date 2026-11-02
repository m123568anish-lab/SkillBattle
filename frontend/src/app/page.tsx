import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";

export const metadata: Metadata = {
  title: "Qubira — Learn. Build. Compete.",
  description: "Master technical skills, prepare for interviews, solve coding challenges, and compete with developers through Qubira, an intelligent skill development platform.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Qubira — Learn. Build. Compete.",
    description: "Master technical skills, prepare for interviews, solve coding challenges, and compete with developers through Qubira, an intelligent skill development platform.",
    url: "/",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Qubira — Learn. Build. Compete." }],
  },
};

export default function HomePage() {
  return <HomePageClient />;
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "@/context/AuthContext";
import PageMetadata from "@/components/common/PageMetadata";


import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://skillbattle.app"),
  title: {
    default: "SkillBattle | AI Coding Battles",
    template: "%s | SkillBattle",
  },
  description: "Practice coding, compete in live battles, and build interview-ready skills with SkillBattle.",
  applicationName: "SkillBattle",
  keywords: ["coding practice", "coding battles", "interview preparation", "DSA", "AI coach"],
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "SkillBattle | AI Coding Battles",
    description: "Practice coding, compete in live battles, and build interview-ready skills.",
    type: "website",
    siteName: "SkillBattle",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth`}
    >
      <body className="min-h-screen bg-[#070B14] text-white">
        <AuthProvider>
          <div className="relative">
            <PageMetadata />
            {children}
          </div>
        </AuthProvider>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#111827",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
            },
          }}
        />
      </body>
    </html>
  );
}
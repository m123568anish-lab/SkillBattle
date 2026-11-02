import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "@/context/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import PageMetadata from "@/components/common/PageMetadata";
import { CookieConsent, PageEnhancements } from "@/components/common/ExperienceEnhancements";


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
  metadataBase: new URL("https://qubira.app"),
  title: {
    default: "Qubira — Learn. Build. Compete.",
    template: "%s | Qubira",
  },
  description: "Master technical skills, prepare for interviews, solve coding challenges, and compete with developers through Qubira, an intelligent skill development platform.",
  applicationName: "Qubira",
  keywords: ["Qubira", "coding practice", "coding battles", "interview preparation", "DSA", "AI mentorship", "system design"],
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "Qubira — Learn. Build. Compete.",
    description: "Master technical skills, prepare for interviews, solve coding challenges, and compete with developers through Qubira, an intelligent skill development platform.",
    type: "website",
    siteName: "Qubira",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Qubira — Learn. Build. Compete." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Qubira — Learn. Build. Compete.",
    description: "Master technical skills, prepare for interviews, solve coding challenges, and compete with developers through Qubira, an intelligent skill development platform.",
    images: ["/opengraph-image"],
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
      <body className="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)]">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <ClerkProvider>
          <AuthProvider>
            <div className="relative">
              <PageMetadata />
              <AuthGuard>{children}</AuthGuard>
              <PageEnhancements />
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
          <CookieConsent />
        </ClerkProvider>
      </body>
    </html>
  );
}

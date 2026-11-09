import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "@/context/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import PageMetadata from "@/components/common/PageMetadata";
import { CookieConsent, PageEnhancements } from "@/components/common/ExperienceEnhancements";
import { ThemeProvider, themeBootstrapScript } from "@/components/common/ThemeProvider";


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
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)]">
        <Script
          id="qubira-theme-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <ThemeProvider>
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
                background: "var(--surface-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-default)",
              },
            }}
          />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}

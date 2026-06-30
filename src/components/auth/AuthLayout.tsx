import * as React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.25),_transparent_35%),linear-gradient(135deg,_#060816_0%,_#090d1d_100%)] px-6 py-16 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center">
        {children}
      </div>
    </main>
  );
}

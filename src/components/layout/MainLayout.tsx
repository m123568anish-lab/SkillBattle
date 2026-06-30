import { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({
  children,
}: MainLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070B14] text-white">
      {children}
    </main>
  );
}
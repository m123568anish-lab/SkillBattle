"use client";

import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";

interface Props {
  children: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: Props) {
  return (
    <main
      className="
        flex
        min-h-screen
        bg-[#050816]
      "
    >
      <Sidebar />

      <section
        className="
          flex-1
          overflow-auto
          p-8
        "
      >
        <TopNavbar />

        {children}

      </section>

    </main>
  );
}
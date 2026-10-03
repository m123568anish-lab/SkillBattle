import * as React from "react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1020]/95 p-6 shadow-2xl shadow-black/30 sm:p-9">
      <div className="mb-7">
        <h1 className="text-3xl font-semibold tracking-normal text-white">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

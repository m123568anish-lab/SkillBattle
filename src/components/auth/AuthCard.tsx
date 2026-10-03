import * as React from "react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(18,40,31,0.08)] sm:p-9">
      <div className="mb-7">
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

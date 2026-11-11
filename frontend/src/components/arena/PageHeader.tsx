import React from "react";
import Breadcrumbs, { BreadcrumbItem } from "./Breadcrumbs";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  theme?: "practice" | "battle" | "neutral";
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  breadcrumbs,
  actions,
  theme = "neutral",
  className = "",
}: PageHeaderProps) {
  const accentGradient = {
    practice: "from-indigo-400 via-sky-300 to-indigo-200",
    battle: "from-[#D8FF3E] via-[#EAFCCB] to-[#A1A1AA]",
    neutral: "from-white via-slate-200 to-slate-400",
  }[theme];

  return (
    <div className={`space-y-3 border-b border-[#252525] pb-4 ${className}`}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-2" />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1
              className={`break-words text-2xl font-extrabold tracking-tight bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent sm:text-3xl`}
            >
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 sm:gap-3 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;

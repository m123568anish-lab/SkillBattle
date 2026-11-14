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
  const accent = {
    practice: "var(--status-info)",
    battle: "var(--accent-strong)",
    neutral: "var(--text-primary)",
  }[theme];

  return (
    <div className={`space-y-4 border-b border-[var(--border-default)] pb-5 ${className}`}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-2" />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="q-display break-words text-2xl sm:text-3xl" style={{ color: accent }}>
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && <p className="max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 sm:gap-3 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-slate-400 ${className}`}>
      <ol className="flex items-center space-x-2">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 transition-colors hover:text-white"
            title="Dashboard"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-2">
              <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
              {isLast || !item.href ? (
                <span className={`font-medium ${isLast ? "text-slate-200" : "text-slate-400"}`}>
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-white hover:underline underline-offset-4"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;

import Link from "next/link";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
}

export default function EmptyState({
  title,
  description,
  icon = <Inbox className="h-7 w-7" />,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
        {icon}
      </div>
      <h2 className="mt-4 text-lg font-bold text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="mt-5 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
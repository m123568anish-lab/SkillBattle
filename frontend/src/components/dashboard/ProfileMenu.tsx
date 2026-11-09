"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ChevronRight,
  LockKeyhole,
  LogOut,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getPortalKind } from "@/data/dashboard";
import HeaderPanel from "./HeaderPanel";

export default function ProfileMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const portal = getPortalKind(pathname);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const displayName = user?.full_name || user?.username || "User";
  const email = user?.email || "Your account";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "QB";
  const avatarUrl = user?.avatar_url || user?.avatar || null;

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  const menuActions = useMemo(() => {
    const role = (user?.role || user?.account_type || "student").toLowerCase();
    const isAdmin = Boolean(user?.is_superuser || role.includes("admin"));
    const isCollege = role.includes("college");
    const isCompany = role.includes("company");
    const items = [
      { label: "Profile", description: "View your profile", href: "/profile", icon: User },
      { label: "Settings", description: "Manage preferences", href: "/settings", icon: Settings },
      { label: "Notifications", description: "Recent activity", href: "/activity", icon: Bell },
    ];

    if (isCollege) {
      items.splice(1, 0, { label: "Organization Profile", description: "Institution details", href: "/organization-setup", icon: Building2 });
    }

    if (isCompany) {
      items.splice(1, 0, { label: "Company Profile", description: "Organization details", href: "/organization-setup", icon: BriefcaseBusiness });
    }

    if (isAdmin) {
      items.push({ label: "Admin Settings", description: "Platform controls", href: "/admin?tab=settings", icon: ShieldCheck });
      items.push({ label: "Security", description: "Account protection", href: "/settings", icon: LockKeyhole });
    }

    return items;
  }, [user]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  async function handleLogout() {
    setIsMenuOpen(false);
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  }

  const handleNavigate = (href: string) => {
    setIsMenuOpen(false);
    router.push(href);
  };

  if (!isAuthenticated) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        suppressHydrationWarning
        aria-label="Open profile menu"
        aria-expanded={isMenuOpen}
        aria-haspopup="dialog"
        onClick={() => setIsMenuOpen((open) => !open)}
        className="flex h-9 items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-1.5 text-left transition hover:border-[var(--accent)] hover:shadow-[0_0_12px_rgba(216,255,62,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] sm:h-10 sm:gap-3 sm:px-2.5 md:px-4"
      >
        <div className="relative">
          {avatarUrl && !avatarError ? (
            <Image
              src={avatarUrl}
              alt={`${displayName} profile photo`}
              width={36}
              height={36}
              unoptimized
              onError={() => setAvatarError(true)}
              className="relative h-7 w-7 rounded-full border border-[var(--accent)]/30 object-cover sm:h-8 sm:w-8 md:h-9 md:w-9"
            />
          ) : (
            <div className="relative grid h-7 w-7 place-items-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] text-[10px] font-black text-[var(--accent-strong)] sm:h-8 sm:w-8 sm:text-xs md:h-9 md:w-9">
              {initials}
            </div>
          )}
        </div>

        <div className="hidden text-left md:block">
          <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">{displayName}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {portal === "student" ? `Level ${user?.level ?? 1}` : portal === "college" ? "College account" : portal === "company" ? "Company account" : "Admin account"}
          </p>
        </div>

        <ChevronDown size={16} className={`hidden text-[var(--text-muted)] transition md:block ${isMenuOpen ? "rotate-180 text-[var(--text-primary)]" : ""}`} />
      </button>

      <HeaderPanel
        open={isMenuOpen}
        title="Account"
        onClose={() => setIsMenuOpen(false)}
        mobilePresentation="popover"
      >
        <div className="mb-2 flex items-center gap-3 border-b border-[var(--border-subtle)] px-3 py-3">
          {avatarUrl && !avatarError ? (
            <Image
              src={avatarUrl}
              alt={`${displayName} profile photo`}
              width={44}
              height={44}
              unoptimized
              onError={() => setAvatarError(true)}
              className="h-11 w-11 rounded-full border border-[var(--accent)]/40 object-cover"
            />
          ) : (
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] text-sm font-black text-[var(--accent-strong)]">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[var(--text-primary)]">{displayName}</p>
            <p className="truncate text-xs text-[var(--text-secondary)]">{email}</p>
          </div>
        </div>

        <div className="space-y-1 p-2">
          {menuActions.map(({ label, description, href, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleNavigate(href)}
              className="group flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition hover:border-[var(--border-default)] hover:bg-[var(--surface-subtle)]"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent-strong)]">
                <Icon size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[var(--text-primary)]">{label}</span>
                <span className="block text-[11px] text-[var(--text-secondary)]">{description}</span>
              </span>
              <ChevronRight size={15} className="text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent-strong)]" />
            </button>
          ))}
        </div>

        <div className="mt-1 border-t border-[var(--border-subtle)] px-2 pb-2 pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="group/logout flex w-full items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-400 transition-all hover:bg-rose-500 hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]"
          >
            <span className="flex items-center gap-2">
              <LogOut size={16} className="transition-transform group-hover/logout:-translate-x-1" />
              Sign Out
            </span>
          </button>
        </div>
      </HeaderPanel>
    </div>
  );
}

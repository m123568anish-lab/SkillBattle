"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Clock3 } from "lucide-react";
import AdminOverview from "@/components/admin/AdminOverview";
import DailyChallengeForm from "@/components/admin/DailyChallengeForm";
import UserManagement from "@/components/admin/UserManagement";
import BattleLogs from "@/components/admin/BattleLogs";
import BattleSettingsForm from "@/components/admin/BattleSettingsForm";
import SystemHealthPanel from "@/components/admin/SystemHealthPanel";
import AdminVerificationPanel from "@/components/admin/AdminVerificationPanel";
import PlacementIntelligencePanel from "@/components/admin/PlacementIntelligencePanel";
import SeoGrowthCenter from "@/components/admin/seo/SeoGrowthCenter";
import SecurityTrustCenter from "@/components/admin/security/SecurityTrustCenter";

const copy: Record<string, { title: string; description: string }> = {
  overview: { title: "Command center", description: "A verified view of Qubira platform activity, dependencies, and operational signals." },
  users: { title: "User management", description: "Review accounts and apply permitted status changes with server-side authorization." },
  challenge: { title: "Daily challenges", description: "Publish the current challenge using the existing challenge service." },
  placement: { title: "Placement intelligence", description: "Inspect catalogue coverage, ingestion jobs, shortages, and provider availability." },
  seo: { title: "SEO & growth", description: "Review production SEO configuration and connected provider status." },
  server: { title: "Server health", description: "Separate runtime connectivity, dependency state, and recorded migration information." },
  logs: { title: "System logs", description: "Review recent battle and platform events returned by the admin API." },
  security: { title: "Security trust center", description: "Inspect security controls and evidence without exposing secrets." },
  verification: { title: "Verification", description: "Review platform verification signals from live backend health data." },
  settings: { title: "Global settings", description: "Manage supported battle settings through the existing protected API." },
};

function AdminPageContent() {
  const params = useSearchParams();
  const tab = params.get("tab") || "overview";
  const active = copy[tab] || copy.overview;

  return <div className="mx-auto max-w-[1600px] space-y-8">
    <section className="flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-7 xl:flex-row xl:items-end">
      <div><div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-lime-300"><span className="h-1.5 w-1.5 rounded-full bg-lime-300" /> Platform operations</div><h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{active.title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">{active.description}</p></div>
      <div className="flex items-center gap-3 text-xs text-slate-500"><Clock3 className="h-4 w-4" /> Data is loaded from protected admin endpoints</div>
    </section>
    {tab === "overview" && <AdminOverview />}
    {tab === "users" && <UserManagement />}
    {tab === "challenge" && <div className="max-w-3xl"><DailyChallengeForm /></div>}
    {tab === "placement" && <PlacementIntelligencePanel />}
    {tab === "seo" && <SeoGrowthCenter />}
    {tab === "server" && <SystemHealthPanel />}
    {tab === "logs" && <BattleLogs />}
    {tab === "security" && <SecurityTrustCenter />}
    {tab === "verification" && <AdminVerificationPanel />}
    {tab === "settings" && <div className="max-w-3xl"><BattleSettingsForm /></div>}
  </div>;
}

export default function AdminPage() {
  return <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.03]" />}><AdminPageContent /></Suspense>;
}

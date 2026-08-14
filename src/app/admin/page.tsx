"use client";

import { useSearchParams } from "next/navigation";
import DailyChallengeForm from "@/components/admin/DailyChallengeForm";
import UserManagement from "@/components/admin/UserManagement";
import BattleLogs from "@/components/admin/BattleLogs";
import BattleSettingsForm from "@/components/admin/BattleSettingsForm";
import AdminOverview from "@/components/admin/AdminOverview";

export default function AdminPage() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header for the specific active tab */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
          {activeTab === "overview" && "Platform Overview"}
          {activeTab === "challenge" && "Daily Challenge Control"}
          {activeTab === "users" && "User Management"}
          {activeTab === "logs" && "Live System Logs"}
          {activeTab === "settings" && "Global Configurations"}
          {activeTab === "server" && "Server Health"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {activeTab === "overview" && "High-level metrics and health of the BattleAI ecosystem."}
          {activeTab === "challenge" && "Configure the coding challenge of the day."}
          {activeTab === "users" && "Manage accounts, roles, and ban users."}
          {activeTab === "logs" && "Monitor battle arena logs and match outcomes."}
          {activeTab === "settings" && "Adjust global matchmaking rules and experience point rewards."}
          {activeTab === "server" && "Real-time metrics for backend, databases, and microservices."}
        </p>
      </div>

      {/* Content Rendering based on Tab */}
      <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-3xl shadow-2xl shadow-black/50">
        {activeTab === "overview" && <AdminOverview />}
        {activeTab === "challenge" && (
          <div className="max-w-2xl mx-auto">
            <DailyChallengeForm />
          </div>
        )}
        {activeTab === "users" && <UserManagement />}
        {activeTab === "logs" && <BattleLogs />}
        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto">
            <BattleSettingsForm />
          </div>
        )}
        {activeTab === "server" && (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/10">
            <p className="text-slate-400">Advanced Server Monitoring coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}

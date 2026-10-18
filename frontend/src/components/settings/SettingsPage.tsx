"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import {
  Palette,
  Bell,
  Shield,
  Lock,
  MonitorSmartphone,
  Link2,
  AlertTriangle,
  Check,
  Trash2,
  LogOut,
  Upload,
  Sparkles,
  Key,
  CheckCircle2,
  Copy,
  X,
  Sun,
  Moon,
  Laptop,
  Building,
  Target,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authService } from "@/services/auth.service";
import { toast } from "react-hot-toast";

type SettingTab =
  | "appearance"
  | "notifications"
  | "privacy"
  | "security"
  | "sessions"
  | "accounts"
  | "danger";

interface TabConfig {
  id: SettingTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const TABS: TabConfig[] = [
  { id: "appearance", label: "Appearance", icon: Palette, description: "Color theme and visual system" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Match, streak, and alert preferences" },
  { id: "privacy", label: "Privacy & Access", icon: Shield, description: "Recruiter discovery & data sharing" },
  { id: "security", label: "Security & 2FA", icon: Lock, description: "Password and two-factor authentication" },
  { id: "sessions", label: "Active Sessions", icon: MonitorSmartphone, description: "Logged in devices and security tokens" },
  { id: "accounts", label: "Linked Accounts", icon: Link2, description: "Connected identity providers and OAuth" },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle, description: "Account deletion and reset controls" },
];

type ActiveSession = {
  id: string;
  device_name: string;
  device_os: string;
  browser: string;
  ip_address: string | null;
  user_agent: string;
  created_at: string;
  last_used_at: string | null;
  expires_at: string;
  revoked: boolean;
  revoked_at: string | null;
  active: boolean;
};

type SharingSettings = {
  share_contact_info: boolean;
  share_skill_profile: boolean;
  share_assessment_results: boolean;
  allow_recruiter_search: boolean;
};

const defaultSharing: SharingSettings = {
  share_contact_info: false,
  share_skill_profile: false,
  share_assessment_results: false,
  allow_recruiter_search: false,
};

type NotificationPreferences = {
  email_battles: boolean;
  email_achievements: boolean;
  email_marketing: boolean;
  in_app_tournaments: boolean;
  in_app_friend_requests: boolean;
  in_app_system: boolean;
};

const defaultNotifications: NotificationPreferences = {
  email_battles: true,
  email_achievements: true,
  email_marketing: false,
  in_app_tournaments: true,
  in_app_friend_requests: true,
  in_app_system: true,
};

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<SettingTab>("appearance");

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    const matchingTab = TABS.find((tab) => tab.id === requestedTab);
    if (matchingTab) setActiveTab(matchingTab.id);
  }, []);

  // Appearance Theme state
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [themeSaving, setThemeSaving] = useState(false);

  // Notification Preferences state
  const [notifications, setNotifications] = useState<NotificationPreferences>(defaultNotifications);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);

  // Privacy Sharing state
  const [sharing, setSharing] = useState<SharingSettings>(defaultSharing);
  const [sharingLoading, setSharingLoading] = useState(true);
  const [sharingSaving, setSharingSaving] = useState<keyof SharingSettings | null>(null);
  const [sharingError, setSharingError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsSaving, setSessionsSaving] = useState<string | null | "all">(null);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const [deletePasswordInput, setDeletePasswordInput] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  // 1. Load preferences (theme + notifications) only when needed
  useEffect(() => {
    if (activeTab !== "appearance" && activeTab !== "notifications") return;
    let active = true;
    async function loadPreferences() {
      try {
        const response = await api.get<{
          theme: string;
          notification_preferences: NotificationPreferences;
        }>("/profile/preferences");
        if (!active) return;
        if (response.data.theme === "dark" || response.data.theme === "light" || response.data.theme === "system") {
          setTheme(response.data.theme);
        }
        if (response.data.notification_preferences) {
          setNotifications((prev) => ({ ...prev, ...response.data.notification_preferences }));
        }
      } catch {
        // Fallback to local storage theme if API fails
        const localTheme = localStorage.getItem("theme");
        if (localTheme === "light" || localTheme === "dark" || localTheme === "system") {
          setTheme(localTheme);
        }
      } finally {
        if (active) setNotifLoading(false);
      }
    }
    void loadPreferences();
    return () => {
      active = false;
    };
  }, [activeTab]);

  // 2. Load privacy sharing settings & 2FA status only when needed
  useEffect(() => {
    if (activeTab !== "privacy" && activeTab !== "security") return;
    let active = true;
    async function loadPrivacyAnd2FA() {
      const [privacyResult, userResult] = await Promise.allSettled([
        api.get<SharingSettings>("/profile/sharing-settings"),
        api.get<{ two_factor_enabled?: boolean }>("/auth/me"),
      ]);
      if (!active) return;
      if (privacyResult.status === "fulfilled") setSharing(privacyResult.value.data);
      else setSharingError("Candidate-sharing settings could not be loaded.");

      if (userResult.status === "fulfilled") {
        setTwoFactorEnabled(Boolean(userResult.value.data.two_factor_enabled));
      }
      setSharingLoading(false);
    }
    void loadPrivacyAnd2FA();
    return () => {
      active = false;
    };
  }, [activeTab]);

  // 3. Load active sessions only when sessions tab is selected
  useEffect(() => {
    if (activeTab !== "sessions") return;
    let active = true;
    async function loadSessions() {
      try {
        const response = await api.get<ActiveSession[]>("/auth/sessions");
        if (active) setSessions(response.data);
      } catch {
        if (active) setSessions([]);
      } finally {
        if (active) setSessionsLoading(false);
      }
    }
    void loadSessions();
    return () => {
      active = false;
    };
  }, [activeTab]);

  // Theme change handler
  async function handleThemeChange(newTheme: "dark" | "light" | "system") {
    setTheme(newTheme);
    setThemeSaving(true);

    // Apply to DOM
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", prefersDark);
    }

    try {
      localStorage.setItem("theme", newTheme);
      await api.put("/profile/preferences", {
        theme: newTheme,
        notification_preferences: notifications,
      });
      toast.success(`Theme updated to ${newTheme} mode.`);
    } catch {
      toast.error("Failed to persist theme preference.");
    } finally {
      setThemeSaving(false);
    }
  }

  // Notification toggle handler
  async function handleNotificationToggle(key: keyof NotificationPreferences) {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    setNotifSaving(true);
    try {
      await api.put("/profile/preferences", {
        theme,
        notification_preferences: updated,
      });
      toast.success("Notification preferences saved.");
    } catch {
      toast.error("Failed to save notification preferences.");
      // Rollback
      setNotifications(notifications);
    } finally {
      setNotifSaving(false);
    }
  }

  // Privacy toggle handler
  async function updateSharing(key: keyof SharingSettings, value: boolean) {
    setSharingSaving(key);
    setSharingError(null);
    try {
      const response = await api.put<SharingSettings>("/profile/sharing-settings", {
        ...sharing,
        [key]: value,
      });
      setSharing(response.data);
      toast.success("Privacy settings updated.");
    } catch (err: any) {
      const message = err?.response?.data?.detail || "Sharing settings could not be saved.";
      setSharingError(message);
      toast.error(message);
    } finally {
      setSharingSaving(null);
    }
  }

  // Password change handler
  async function handlePasswordChange() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);

    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password updated successfully! ✨");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Unable to change password.";
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  }

  // 2FA setup handler
  async function startTwoFactorSetup() {
    if (!twoFactorPassword) {
      setTwoFactorError("Enter your current account password to begin setup.");
      return;
    }
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    try {
      const response = await api.post<{
        secret: string;
        provisioning_uri?: string;
        recovery_codes: string[];
      }>("/auth/2fa/setup", {
        password: twoFactorPassword,
      });
      setTwoFactorSecret(response.data.secret);
      setRecoveryCodes(response.data.recovery_codes || []);
      setTwoFactorPassword("");
      toast.success("Verification secret generated. Enter the code from your app.");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Could not start two-factor setup.";
      setTwoFactorError(msg);
      toast.error(msg);
    } finally {
      setTwoFactorLoading(false);
    }
  }

  // 2FA verify code handler
  async function verifyTwoFactor() {
    if (!twoFactorCode || twoFactorCode.trim().length !== 6) {
      setTwoFactorError("Enter the 6-digit authentication code.");
      return;
    }
    setTwoFactorLoading(true);
    setTwoFactorError(null);
    try {
      await api.post("/auth/2fa/verify", {
        code: twoFactorCode.trim(),
      });
      setTwoFactorEnabled(true);
      setTwoFactorSecret(null);
      setTwoFactorCode("");
      toast.success("Two-Factor Authentication is now enabled! 🛡️");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Invalid code. Please try again.";
      setTwoFactorError(msg);
      toast.error(msg);
    } finally {
      setTwoFactorLoading(false);
    }
  }

  // Session revocation
  async function revokeSession(sessionId: string) {
    setSessionsSaving(sessionId);
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      toast.success("Session revoked.");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Session could not be revoked.");
    } finally {
      setSessionsSaving(null);
    }
  }

  // Sign out all other sessions
  async function signOutAllDevices() {
    setSessionsSaving("all");
    try {
      await api.post("/auth/logout-all");
      setSessions([]);
      toast.success("All other sessions revoked.");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Sessions could not be revoked.");
    } finally {
      setSessionsSaving(null);
    }
  }

  // Delete account handler
  async function handleDeleteAccount() {
    if (deleteConfirmationInput.trim() !== "DELETE") {
      setDeleteAccountError("You must type the exact word DELETE to confirm.");
      return;
    }
    setDeletingAccount(true);
    setDeleteAccountError(null);
    try {
      await authService.deleteAccount(deleteConfirmationInput.trim(), deletePasswordInput || undefined);
      toast.success("Account permanently deleted.");
      useAuthStore.getState().logout();
      window.location.href = "/login";
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to delete account.";
      setDeleteAccountError(msg);
      toast.error(msg);
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Settings Navigation Header */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Settings Sidebar Tabs */}
        <aside className="rounded-3xl border border-white/[0.08] bg-[#0a0f1d] p-3 shadow-2xl shadow-black/50 self-start">
          <div className="p-3 mb-2 border-b border-white/[0.06]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Settings Center</p>
            <h2 className="text-lg font-black text-white">Preferences</h2>
          </div>
          <nav className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-all duration-150 ${
                    active
                      ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold shadow-md shadow-cyan-500/5"
                      : "text-slate-400 border border-transparent hover:bg-white/[0.04] hover:text-slate-200"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-cyan-400" : "text-slate-500"}`} />
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold tracking-wide truncate">{tab.label}</span>
                  </div>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Tab Content Panel */}
        <main className="min-w-0">
          <AnimatePresence mode="wait">
            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <motion.section
                key="appearance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f1d] p-6 sm:p-8 text-white shadow-2xl shadow-black/50 space-y-6">
                  <div className="border-b border-white/[0.06] pb-5">
                    <h3 className="text-xl font-bold text-white">Interface Theme</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose how SkillBattle AI is rendered. Changes persist to your account profile.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { id: "dark" as const, title: "Dark Arena", desc: "Deep charcoal near-black surfaces", icon: Moon },
                      { id: "light" as const, title: "Clean Light", desc: "Crisp white & cool slate contrast", icon: Sun },
                      { id: "system" as const, title: "System Sync", desc: "Matches your operating system", icon: Laptop },
                    ].map((option) => {
                      const Icon = option.icon;
                      const selected = theme === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleThemeChange(option.id)}
                          disabled={themeSaving}
                          className={`flex flex-col items-start rounded-2xl border p-5 text-left transition-all ${
                            selected
                              ? "border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/10 text-white"
                              : "border-white/[0.08] bg-[#060913]/60 text-slate-300 hover:border-white/20"
                          }`}
                        >
                          <div className="flex w-full items-center justify-between mb-3">
                            <div className={`p-2 rounded-xl ${selected ? "bg-cyan-500/20 text-cyan-300" : "bg-white/[0.04] text-slate-400"}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            {selected && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-slate-950">
                                <Check size={12} strokeWidth={3} />
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-sm text-white">{option.title}</p>
                          <p className="text-xs text-slate-400 mt-1 leading-snug">{option.desc}</p>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-slate-500 pt-2">
                    {themeSaving ? "Saving theme..." : `Current active setting: ${theme.toUpperCase()} mode.`}
                  </p>
                </div>
              </motion.section>
            )}

            {/* 3. Notifications Tab */}
            {activeTab === "notifications" && (
              <motion.section
                key="notifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f1d] p-6 sm:p-8 text-white shadow-2xl shadow-black/50 space-y-6">
                  <div className="border-b border-white/[0.06] pb-5">
                    <h3 className="text-xl font-bold text-white">Notification Preferences</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose which events trigger email notifications and in-app battle updates.
                    </p>
                  </div>

                  {notifLoading ? (
                    <p className="text-xs text-slate-400 py-4">Loading saved notification preferences...</p>
                  ) : (
                    <div className="space-y-3">
                      {[
                        {
                          key: "email_battles" as const,
                          title: "Match & Battle Invites",
                          desc: "Receive alerts for scheduled 1v1 challenges and squad matches.",
                        },
                        {
                          key: "email_achievements" as const,
                          title: "Achievement & Level Unlocks",
                          desc: "Get notified when you earn badges or reach progression milestones.",
                        },
                        {
                          key: "in_app_tournaments" as const,
                          title: "Tournament Bracket Updates",
                          desc: "Reminders when tournament rounds commence and your match is up.",
                        },
                        {
                          key: "in_app_friend_requests" as const,
                          title: "Friend Requests & Squad Invites",
                          desc: "Notifications when other competitors add you or invite you to squads.",
                        },
                        {
                          key: "in_app_system" as const,
                          title: "System & Placement Signals",
                          desc: "Important intelligence updates regarding candidate readiness and OAs.",
                        },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-[#060913]/60 p-4 cursor-pointer hover:border-white/10 transition"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-white">{item.title}</span>
                            <span className="block text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(notifications[item.key])}
                            disabled={notifSaving}
                            onChange={() => handleNotificationToggle(item.key)}
                            className="h-5 w-5 rounded-md accent-cyan-400 cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>
                  )}

                  {notifSaving && <p className="text-xs text-cyan-400">Saving notification preference...</p>}
                </div>
              </motion.section>
            )}

            {/* 4. Privacy & Access Tab */}
            {activeTab === "privacy" && (
              <motion.section
                key="privacy"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f1d] p-6 sm:p-8 text-white shadow-2xl shadow-black/50 space-y-6">
                  <div className="border-b border-white/[0.06] pb-5">
                    <h3 className="text-xl font-bold text-white">Candidate Sharing Controls</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Control which verified skill scores and candidate details are visible to hiring companies.
                    </p>
                  </div>

                  {sharingError && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                      {sharingError}
                    </div>
                  )}

                  {sharingLoading ? (
                    <p className="text-xs text-slate-400 py-4">Loading privacy controls...</p>
                  ) : (
                    <div className="space-y-3">
                      {[
                        {
                          key: "share_contact_info" as const,
                          title: "Share Contact Information",
                          desc: "Allow verified employers to view your name, verified email, and phone once applied.",
                        },
                        {
                          key: "share_skill_profile" as const,
                          title: "Share Skill Profile Evidence",
                          desc: "Allow algorithmically verified skill gaps, ratings, and OA badges to be matched.",
                        },
                        {
                          key: "share_assessment_results" as const,
                          title: "Share Assessment Results",
                          desc: "Include placement test and practice OA scores in recruiter company profiles.",
                        },
                        {
                          key: "allow_recruiter_search" as const,
                          title: "Allow Recruiter Discovery",
                          desc: "Allow companies using SkillBattle's candidate search to find your profile by relevant skill tags.",
                        },
                      ].map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-[#060913]/60 p-4 cursor-pointer hover:border-white/10 transition"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="block text-sm font-bold text-white">{item.title}</span>
                            <span className="block text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean(sharing[item.key])}
                            disabled={sharingSaving !== null}
                            onChange={(e) => updateSharing(item.key, e.target.checked)}
                            className="h-5 w-5 rounded-md accent-cyan-400 cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>
                  )}

                  {sharingSaving && (
                    <p className="text-xs text-cyan-400">Saving privacy settings...</p>
                  )}
                </div>
              </motion.section>
            )}

            {/* 5. Security & 2FA Tab */}
            {activeTab === "security" && (
              <motion.section
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Change Password Card */}
                <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f1d] p-6 sm:p-8 text-white shadow-2xl shadow-black/50 space-y-6">
                  <div className="border-b border-white/[0.06] pb-5">
                    <h3 className="text-xl font-bold text-white">Change Account Password</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Choose a strong, unique password with at least 8 characters.
                    </p>
                  </div>

                  <div className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full rounded-xl border border-white/[0.08] bg-[#060913] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 outline-none transition"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 8 chars"
                          className="w-full rounded-xl border border-white/[0.08] bg-[#060913] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full rounded-xl border border-white/[0.08] bg-[#060913] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 outline-none transition"
                        />
                      </div>
                    </div>

                    {passwordError && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                        {passwordError}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handlePasswordChange}
                      disabled={passwordLoading || !currentPassword || !newPassword}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition disabled:opacity-40"
                    >
                      <Lock size={14} />
                      <span>{passwordLoading ? "Updating..." : "Update Password"}</span>
                    </button>
                  </div>
                </div>

                {/* Two-Factor Authentication Card */}
                <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f1d] p-6 sm:p-8 text-white shadow-2xl shadow-black/50 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
                    <div>
                      <h3 className="text-xl font-bold text-white">Two-Factor Authentication (2FA)</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Protect your account with standard TOTP authenticator apps (Google Authenticator, Authy).
                      </p>
                    </div>
                    {twoFactorEnabled ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                        <CheckCircle2 size={13} className="text-emerald-400" />
                        Enabled & Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
                        Not Enabled
                      </span>
                    )}
                  </div>

                  {twoFactorError && (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                      {twoFactorError}
                    </div>
                  )}

                  {!twoFactorEnabled && !twoFactorSecret && (
                    <div className="space-y-4 max-w-md">
                      <p className="text-xs leading-relaxed text-slate-300">
                        To enable TOTP 2FA, enter your current password to generate your secret key:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={twoFactorPassword}
                          onChange={(e) => setTwoFactorPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="flex-1 rounded-xl border border-white/[0.08] bg-[#060913] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 outline-none"
                        />
                        <button
                          type="button"
                          onClick={startTwoFactorSetup}
                          disabled={twoFactorLoading || !twoFactorPassword}
                          className="rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2.5 text-xs font-bold text-white transition disabled:opacity-40"
                        >
                          {twoFactorLoading ? "Generating..." : "Begin Setup"}
                        </button>
                      </div>
                    </div>
                  )}

                  {!twoFactorEnabled && twoFactorSecret && (
                    <div className="space-y-4 rounded-2xl border border-violet-500/20 bg-violet-500/[0.05] p-5">
                      <h4 className="text-sm font-bold text-white">Step 2: Enter Key into Authenticator</h4>
                      <p className="text-xs text-slate-300">
                        Add this secret key into your authenticator app (Google Authenticator, Microsoft Authenticator, or 1Password):
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="rounded-lg bg-[#060913] px-3 py-2 font-mono text-xs text-cyan-300 select-all border border-white/[0.08]">
                          {twoFactorSecret}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(twoFactorSecret);
                            toast.success("Secret copied to clipboard!");
                          }}
                          className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white"
                          title="Copy Secret"
                        >
                          <Copy size={14} />
                        </button>
                      </div>

                      {recoveryCodes.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                            Backup Recovery Codes (Save these safely):
                          </p>
                          <div className="grid grid-cols-2 gap-2 font-mono text-xs text-slate-300 bg-[#060913] p-3 rounded-xl border border-white/[0.08]">
                            {recoveryCodes.map((code) => (
                              <span key={code}>{code}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex gap-2 max-w-xs">
                        <input
                          type="text"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value)}
                          placeholder="6-digit code"
                          maxLength={6}
                          className="w-36 rounded-xl border border-white/[0.08] bg-[#060913] px-3 py-2 text-center text-sm font-mono tracking-widest text-white outline-none focus:border-cyan-400"
                        />
                        <button
                          type="button"
                          onClick={verifyTwoFactor}
                          disabled={twoFactorLoading || twoFactorCode.length !== 6}
                          className="rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 transition disabled:opacity-40"
                        >
                          {twoFactorLoading ? "Verifying..." : "Confirm & Activate"}
                        </button>
                      </div>
                    </div>
                  )}

                  {twoFactorEnabled && (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 text-xs text-emerald-200">
                      Two-Factor Authentication is currently safeguarding your account. Any new device login requires a valid 6-digit TOTP code.
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {/* 6. Active Sessions Tab */}
            {activeTab === "sessions" && (
              <motion.section
                key="sessions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f1d] p-6 sm:p-8 text-white shadow-2xl shadow-black/50 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
                    <div>
                      <h3 className="text-xl font-bold text-white">Active Sessions & Devices</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Review and revoke active sign-ins. Refresh tokens are never exposed.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={signOutAllDevices}
                      disabled={sessionsSaving !== null || sessions.length === 0}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-40"
                    >
                      <LogOut size={13} />
                      <span>{sessionsSaving === "all" ? "Revoking..." : "Sign Out All Other Devices"}</span>
                    </button>
                  </div>

                  {sessionsLoading ? (
                    <p className="text-xs text-slate-400 py-4">Loading active sessions...</p>
                  ) : sessions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/[0.08] bg-[#060913]/40 p-6 text-center text-xs text-slate-400">
                      No additional active sessions detected.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-[#060913]/60 p-4"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white truncate">
                                {session.device_name || session.browser || session.device_os}
                              </span>
                              {session.revoked && (
                                <span className="rounded bg-slate-800 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-400">
                                  Revoked
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {session.browser} · {session.device_os} · {session.ip_address || "Local session"}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Last active {session.last_used_at ? new Date(session.last_used_at).toLocaleDateString() : "Active now"} · Expires {new Date(session.expires_at).toLocaleDateString()}
                            </p>
                          </div>
                          {!session.revoked && (
                            <button
                              type="button"
                              onClick={() => revokeSession(session.id)}
                              disabled={sessionsSaving !== null}
                              className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300 transition disabled:opacity-40"
                            >
                              <Trash2 size={12} />
                              <span>{sessionsSaving === session.id ? "Revoking..." : "Revoke"}</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {/* 7. Linked Accounts Tab */}
            {activeTab === "accounts" && (
              <motion.section
                key="accounts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div className="rounded-3xl border border-white/[0.08] bg-[#0a0f1d] p-6 sm:p-8 text-white shadow-2xl shadow-black/50 space-y-6">
                  <div className="border-b border-white/[0.06] pb-5">
                    <h3 className="text-xl font-bold text-white">Connected Providers & Identities</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Identity providers associated with your SkillBattle AI account
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Primary Email */}
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/[0.06] bg-[#060913]/60">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                          @
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Email & Password</p>
                          <p className="text-xs text-slate-400">{user?.email}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                        Primary Credential
                      </span>
                    </div>

                    {/* Google OAuth */}
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/[0.06] bg-[#060913]/60">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white font-bold text-sm">
                          G
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Google Account</p>
                          <p className="text-xs text-slate-400">Single Sign-On through Clerk Auth</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 text-xs font-semibold text-slate-400">
                        Available via SSO
                      </span>
                    </div>

                    {/* GitHub */}
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-white/[0.06] bg-[#060913]/60">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white font-bold text-sm">
                          GH
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">GitHub Integration</p>
                          <p className="text-xs text-slate-400">For competitive portfolio verification</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-white/[0.04] border border-white/[0.08] px-2.5 py-0.5 text-xs font-semibold text-slate-400">
                        Linked via Profile
                      </span>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {/* 8. Danger Zone Tab */}
            {activeTab === "danger" && (
              <motion.section
                key="danger"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div className="rounded-3xl border border-rose-500/20 bg-rose-500/[0.03] p-6 sm:p-8 text-white shadow-2xl shadow-rose-950/20 space-y-6">
                  <div className="border-b border-rose-500/10 pb-5">
                    <h3 className="text-xl font-bold text-rose-300">Danger Zone Controls</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Destructive account actions. Please proceed with caution.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-white/[0.06] bg-[#060913]/60">
                      <div>
                        <h4 className="text-sm font-bold text-white">Sign Out of Current Session</h4>
                        <p className="text-xs text-slate-400 mt-0.5">End your active authenticated session on this browser.</p>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await useAuthStore.getState().logout();
                          window.location.href = "/login";
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 transition"
                      >
                        <LogOut size={13} />
                        <span>Sign Out</span>
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/[0.08]">
                      <div>
                        <h4 className="text-sm font-bold text-rose-200">Delete SkillBattle Account</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Permanently delete your account, battle records, XP points, and personal identity.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmationInput("");
                          setDeleteAccountError(null);
                          setShowDeleteModal(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition shrink-0"
                      >
                        <Trash2 size={13} />
                        <span>Delete Account</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-rose-500/40 bg-[#0a0f1d] p-6 sm:p-8 shadow-2xl text-white space-y-5 relative"
            >
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-white rounded-full transition"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 text-rose-400">
                <AlertTriangle className="h-6 w-6" />
                <h3 className="text-xl font-black text-white">Permanently Delete Account</h3>
              </div>

              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                <p>
                  This action is <strong className="text-rose-400">permanent and irreversible</strong>.
                </p>
                <p>
                  Your profile, battle Elo, XP, unlocked achievements, OA history, and sharing settings will be wiped.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Type <span className="text-rose-400 font-mono select-all font-black">DELETE</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmationInput}
                    onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full rounded-xl border border-rose-500/40 bg-[#060913] px-4 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 focus:border-rose-400 outline-none"
                  />
                </div>

                {deleteAccountError && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                    {deleteAccountError}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmationInput.trim() !== "DELETE" || deletingAccount}
                  className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{deletingAccount ? "Deleting..." : "Permanently Delete"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

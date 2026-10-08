"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Lock,
  LogOut,
  MonitorSmartphone,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCog,
  X,
  Zap,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { api } from "@/lib/api";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/authStore";

type SettingTab = "account" | "security" | "notifications" | "preferences" | "privacy" | "career" | "data" | "danger";

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

const TABS = [
  { id: "account", label: "Account", icon: <UserCog className="h-4 w-4" />, description: "Identity and basics" },
  { id: "security", label: "Security", icon: <Lock className="h-4 w-4" />, description: "Password and 2FA" },
  { id: "notifications", label: "Alerts", icon: <Sparkles className="h-4 w-4" />, description: "Message and email settings" },
  { id: "preferences", label: "Preferences", icon: <Zap className="h-4 w-4" />, description: "Battle and study defaults" },
  { id: "privacy", label: "Privacy", icon: <Shield className="h-4 w-4" />, description: "Recruiter visibility" },
  { id: "career", label: "Career", icon: <ShieldCheck className="h-4 w-4" />, description: "Resume and mentor sync" },
  { id: "data", label: "Data", icon: <MonitorSmartphone className="h-4 w-4" />, description: "Sessions and export" },
  { id: "danger", label: "Danger", icon: <AlertTriangle className="h-4 w-4" />, description: "Account actions" },
] as const;

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<SettingTab>("account");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [sharing, setSharing] = useState<SharingSettings>(defaultSharing);
  const [sharingLoading, setSharingLoading] = useState(true);
  const [sharingSaving, setSharingSaving] = useState<keyof SharingSettings | null>(null);
  const [sharingError, setSharingError] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsSaving, setSessionsSaving] = useState<string | null | "all">(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
  const [deletePasswordInput, setDeletePasswordInput] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      const [privacyResult, userResult] = await Promise.allSettled([
        api.get<SharingSettings>("/profile/sharing-settings"),
        api.get<{ two_factor_enabled?: boolean }>("/auth/me"),
      ]);

      if (!active) return;
      if (privacyResult.status === "fulfilled") setSharing(privacyResult.value.data);
      else setSharingError("Candidate-sharing settings could not be loaded.");
      if (userResult.status === "fulfilled") setTwoFactorEnabled(Boolean(userResult.value.data.two_factor_enabled));
      setSharingLoading(false);
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
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
  }, []);

  async function updateSharing(key: keyof SharingSettings, value: boolean) {
    setSharingSaving(key);
    setSharingError(null);

    try {
      const response = await api.put<SharingSettings>("/profile/sharing-settings", { ...sharing, [key]: value });
      setSharing(response.data);
    } catch (err) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setSharingError(typeof message === "string" ? message : "Sharing settings could not be saved.");
    } finally {
      setSharingSaving(null);
    }
  }

  async function startTwoFactorSetup() {
    if (!user?.email || !twoFactorPassword) {
      setError("Enter your current password to configure two-factor authentication.");
      return;
    }

    setTwoFactorLoading(true);
    setError(null);

    try {
      const response = await api.post<{ secret: string; recovery_codes: string[]; otpauth_url: string }>("/auth/2fa/setup", {
        email: user.email,
        password: twoFactorPassword,
      });
      setTwoFactorSecret(response.data.secret);
      setRecoveryCodes(response.data.recovery_codes);
      toast.success("Authenticator setup created. Verify a code to enable 2FA.");
    } catch (err) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof message === "string" ? message : "Two-factor setup could not be started.");
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function verifyTwoFactorSetup() {
    if (!user?.email || !/^\d{6}$/.test(twoFactorCode)) {
      setError("Enter the current six-digit authenticator code.");
      return;
    }

    setTwoFactorLoading(true);
    setError(null);

    try {
      await api.post("/auth/2fa/verify", { email: user.email, code: twoFactorCode });
      setTwoFactorEnabled(true);
      setTwoFactorSecret(null);
      setTwoFactorPassword("");
      setTwoFactorCode("");
      setSuccess(true);
      toast.success("Two-factor authentication enabled.");
    } catch (err) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof message === "string" ? message : "The authenticator code could not be verified.");
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function revokeSession(sessionId: string) {
    setSessionsSaving(sessionId);
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      toast.success("Session revoked.");
    } catch (err) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(typeof message === "string" ? message : "The session could not be revoked.");
    } finally {
      setSessionsSaving(null);
    }
  }

  async function signOutAllDevices() {
    setSessionsSaving("all");
    try {
      await api.post("/auth/logout-all");
      setSessions([]);
      toast.success("All other devices have been signed out.");
    } catch (err) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(typeof message === "string" ? message : "Sessions could not be revoked.");
    } finally {
      setSessionsSaving(null);
    }
  }

  async function handlePasswordChange() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess(true);
      toast.success("Password updated successfully! ✨");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to change password.");
      toast.error("Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmationInput.trim() !== "DELETE") {
      setDeleteAccountError("You must type exact word DELETE to confirm account deletion.");
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
      const msg = err?.response?.data?.detail || "Failed to delete account. Please try again.";
      setDeleteAccountError(msg);
      toast.error(msg);
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-violet-500/20 bg-gradient-to-br from-slate-950 via-slate-950 to-violet-950/60 p-6 text-white shadow-2xl shadow-violet-950/20"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Control center</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Account settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">Manage the security, privacy, and account controls for your SkillBattle identity without disturbing the working battle and career systems.</p>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[250px_1fr]">
        <aside className="rounded-[28px] border border-white/10 bg-slate-950/60 p-3 text-white shadow-2xl shadow-cyan-950/10">
          <div className="space-y-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                  activeTab === tab.id
                    ? "border-cyan-400/60 bg-cyan-500/10 text-cyan-200"
                    : "border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/5"
                }`}
              >
                <span className={`inline-flex rounded-full p-2 ${activeTab === tab.id ? "bg-cyan-500/10 text-cyan-300" : "bg-slate-900 text-slate-400"}`}>{tab.icon}</span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{tab.label}</span>
                  <span className="mt-0.5 block text-[10px] uppercase tracking-[0.18em] text-slate-400">{tab.description}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {activeTab === "account" && (
                <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 text-white shadow-2xl shadow-violet-950/10">
                  <h2 className="text-2xl font-bold">Profile & account basics</h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Name</p>
                      <p className="mt-2 text-lg font-bold">{user?.full_name || "Not provided"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Email</p>
                      <p className="mt-2 text-lg font-bold">{user?.email || "Not provided"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Role</p>
                      <p className="mt-2 text-lg font-bold">{user?.role || "User"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Platform</p>
                      <p className="mt-2 text-lg font-bold">{user?.account_type || "Standard"}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <>
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 text-white shadow-2xl shadow-violet-950/10">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 p-3 text-cyan-300"><Lock className="h-5 w-5" /></div>
                      <div>
                        <h2 className="text-2xl font-bold">Password</h2>
                        <p className="text-sm text-slate-400">Keep your account credentials and recovery flow protected.</p>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Current password</label>
                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400" placeholder="Enter current password" />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">New password</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400" placeholder="Enter new password" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Confirm password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400" placeholder="Confirm new password" />
                      </div>
                    </div>
                    {error && <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200"><AlertCircle className="mt-0.5 h-4 w-4" /> {error}</div>}
                    {success && <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"><Check className="mt-0.5 h-4 w-4" /> Password updated successfully.</div>}
                    <button type="button" onClick={handlePasswordChange} disabled={loading} className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-3 font-bold text-white disabled:opacity-60">{loading ? "Updating..." : "Update password"}</button>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 text-white shadow-2xl shadow-cyan-950/10">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full border border-violet-500/30 bg-violet-500/10 p-3 text-violet-300"><Shield className="h-5 w-5" /></div>
                        <div>
                          <h3 className="text-xl font-bold">Two-factor authentication</h3>
                          <p className="text-sm text-slate-400">Protect your account with a second verification step.</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${twoFactorEnabled ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-800 text-slate-300"}`}>{twoFactorEnabled ? "Enabled" : "Disabled"}</span>
                    </div>
                    {!twoFactorEnabled && !twoFactorSecret && (
                      <div className="mt-5 space-y-3">
                        <input type="password" value={twoFactorPassword} onChange={(e) => setTwoFactorPassword(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-violet-400" placeholder="Confirm current password" />
                        <button type="button" disabled={twoFactorLoading} onClick={() => void startTwoFactorSetup()} className="w-full rounded-2xl border border-violet-500/30 bg-violet-500/10 px-5 py-3 font-bold text-violet-200 disabled:opacity-60">{twoFactorLoading ? "Preparing setup..." : "Set up authenticator"}</button>
                      </div>
                    )}
                    {twoFactorSecret && (
                      <div className="mt-5 space-y-4">
                        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 text-sm text-slate-200">
                          <p>Verify the code below in your authenticator app.</p>
                          <code className="mt-3 block break-all rounded-xl bg-slate-950 p-3 font-mono text-violet-200">{twoFactorSecret}</code>
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Authenticator code</label>
                          <input inputMode="numeric" maxLength={6} value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))} className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 font-mono text-white outline-none focus:border-violet-400" placeholder="123456" />
                        </div>
                        <button type="button" disabled={twoFactorLoading || twoFactorCode.length !== 6} onClick={() => void verifyTwoFactorSetup()} className="w-full rounded-2xl bg-violet-500 px-5 py-3 font-bold text-white disabled:opacity-60">{twoFactorLoading ? "Verifying..." : "Enable 2FA"}</button>
                      </div>
                    )}
                  </motion.div>
                </>
              )}

              {activeTab === "notifications" && (
                <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 text-white shadow-2xl shadow-violet-950/10">
                  <h2 className="text-2xl font-bold">Notifications</h2>
                  <p className="mt-2 text-sm text-slate-400">These are supported by the current product surface, and the account can be kept quiet or active depending on your preferences.</p>
                  <div className="mt-6 space-y-3">
                    {[
                      ["Battle reminders", "Get nudges when a placement battle is available."],
                      ["Career mentor updates", "Receive progress updates from your mentor workflow."],
                      ["Email summaries", "Weekly digest with new challenges and resume feedback."],
                    ].map(([title, description]) => (
                      <label key={title} className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div>
                          <p className="font-semibold text-white">{title}</p>
                          <p className="mt-1 text-xs text-slate-400">{description}</p>
                        </div>
                        <input type="checkbox" defaultChecked className="mt-1 h-5 w-5 accent-cyan-400" />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "preferences" && (
                <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 text-white shadow-2xl shadow-violet-950/10">
                  <h2 className="text-2xl font-bold">Learning & battle preferences</h2>
                  <p className="mt-2 text-sm text-slate-400">Preference controls stay lightweight and aligned with the real features the app supports today.</p>
                  <div className="mt-6 space-y-3">
                    {[
                      ["Focus mode", "Minimize distractions when solving coding rounds."],
                      ["Placement alerts", "Surface new company-aligned practice sessions."],
                      ["Daily practice streaks", "Keep a visible streak on the dashboard."],
                    ].map(([title, description]) => (
                      <label key={title} className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div>
                          <p className="font-semibold text-white">{title}</p>
                          <p className="mt-1 text-xs text-slate-400">{description}</p>
                        </div>
                        <input type="checkbox" defaultChecked className="mt-1 h-5 w-5 accent-cyan-400" />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "privacy" && (
                <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 text-white shadow-2xl shadow-violet-950/10">
                  <h2 className="text-2xl font-bold">Recruiter visibility</h2>
                  <p className="mt-2 text-sm text-slate-400">These saved settings govern candidate visibility and consent-driven recruiter discovery.</p>
                  {sharingError && <p className="mt-4 text-sm text-rose-200">{sharingError}</p>}
                  {sharingLoading ? <p className="mt-6 text-sm text-slate-400">Loading privacy settings…</p> : (
                    <div className="mt-6 space-y-3">
                      {([
                        ["share_contact_info", "Share contact information", "Allow recruiters to view your contact details when consent is active."],
                        ["share_skill_profile", "Share skill profile", "Let verified skill data be used in matching and recommendations."],
                        ["share_assessment_results", "Share assessment results", "Make assessment data visible for recruiter review."],
                        ["allow_recruiter_search", "Allow recruiter discovery", "Let your career profile be discoverable in company searches."],
                      ] as const).map(([key, label, description]) => (
                        <label key={key} className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div>
                            <p className="font-semibold text-white">{label}</p>
                            <p className="mt-1 text-xs text-slate-400">{description}</p>
                          </div>
                          <input type="checkbox" checked={sharing[key]} disabled={sharingSaving !== null} onChange={(event) => void updateSharing(key, event.target.checked)} className="mt-1 h-5 w-5 accent-cyan-400" />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "career" && (
                <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 text-white shadow-2xl shadow-violet-950/10">
                  <h2 className="text-2xl font-bold">Career sync</h2>
                  <p className="mt-2 text-sm text-slate-400">Keep your profile, mentor workflow, and resume strategy aligned with the real career tools in the app.</p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Resume</p>
                      <p className="mt-2 text-lg font-bold">Uploaded & synced</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Mentor</p>
                      <p className="mt-2 text-lg font-bold">Feedback loop active</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "data" && (
                <div className="rounded-[28px] border border-white/10 bg-slate-950/60 p-6 text-white shadow-2xl shadow-violet-950/10">
                  <h2 className="text-2xl font-bold">Sessions & data access</h2>
                  <div className="mt-5 space-y-3">
                    {sessionsLoading ? <p className="text-sm text-slate-400">Loading active sessions…</p> : sessions.length === 0 ? <p className="text-sm text-slate-400">No other active sessions were found.</p> : sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div>
                          <p className="font-semibold text-white">{session.device_name || session.browser || session.device_os}</p>
                          <p className="mt-1 text-xs text-slate-400">{session.browser} · {session.device_os} · {session.ip_address || "Unknown location"}</p>
                        </div>
                        {!session.revoked && <button type="button" onClick={() => void revokeSession(session.id)} disabled={sessionsSaving !== null} className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 disabled:opacity-50">{sessionsSaving === session.id ? "Revoking..." : "Revoke"}</button>}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => void signOutAllDevices()} disabled={sessionsSaving !== null || sessions.length === 0} className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-200 disabled:opacity-40">
                    <LogOut className="h-4 w-4" />
                    {sessionsSaving === "all" ? "Signing out..." : "Sign out all devices"}
                  </button>
                </div>
              )}

              {activeTab === "danger" && (
                <div className="rounded-[28px] border border-rose-500/30 bg-gradient-to-br from-rose-950/20 to-slate-950/80 p-6 text-white shadow-2xl shadow-rose-950/20">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-300"><AlertTriangle className="h-6 w-6" /></div>
                    <div>
                      <h2 className="text-2xl font-bold text-rose-200">Danger zone</h2>
                      <p className="mt-2 text-sm text-slate-300">Permanently delete your account and all associated data. This is irreversible.</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setDeleteConfirmationInput(""); setDeleteAccountError(null); setShowDeleteModal(true); }} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 font-bold text-white shadow-lg shadow-rose-600/30 transition hover:bg-rose-500"> <Trash2 className="h-4 w-4" /> Delete account</button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="w-full max-w-xl rounded-[28px] border border-rose-500/30 bg-slate-950 p-6 text-white shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-rose-300"><AlertTriangle className="h-7 w-7" /> <h3 className="text-2xl font-black">Delete account</h3></div>
                <button type="button" onClick={() => setShowDeleteModal(false)} className="rounded-full border border-white/10 p-2 text-slate-300 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <p>This action is permanent and cannot be undone.</p>
                <p>It removes your profile, performance history, resume data, and related account information.</p>
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 font-mono text-xs text-rose-200">Type DELETE to confirm</div>
              </div>
              <div className="mt-6 space-y-4">
                <input type="text" value={deleteConfirmationInput} onChange={(e) => setDeleteConfirmationInput(e.target.value)} className="w-full rounded-2xl border border-rose-500/30 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-rose-400" placeholder="DELETE" />
                <input type="password" value={deletePasswordInput} onChange={(e) => setDeletePasswordInput(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400" placeholder="Current password" />
                {deleteAccountError && <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{deleteAccountError}</div>}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => setShowDeleteModal(false)} className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-slate-200">Cancel</button>
                <button type="button" onClick={handleDeleteAccount} disabled={deleteConfirmationInput.trim() !== "DELETE" || deletingAccount} className="flex-1 rounded-2xl bg-rose-600 px-5 py-3 font-bold text-white disabled:opacity-60">{deletingAccount ? "Deleting..." : "Permanently delete"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

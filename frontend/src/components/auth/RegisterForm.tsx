"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BriefcaseBusiness, Building2, Eye, EyeOff, GraduationCap } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

import GradientButton from "@/components/ui/gradient-button";
import PasswordStrength from "./PasswordStrength";

import { registerSchema, RegisterFormData } from "@/lib/validation";

import { useRegister } from "@/hooks/use-register";
import { AI_AVATARS } from "@/lib/avatars";
import { getPostLoginPath } from "@/lib/auth-routing";

const roleOptions = [
  { key: "STUDENT", label: "Student", detail: "Learn • Practice • Improve", Icon: GraduationCap },
  { key: "COLLEGE", label: "College", detail: "Assess • Manage • Place", Icon: Building2 },
  { key: "COMPANY", label: "Company", detail: "Discover • Hire • Grow", Icon: BriefcaseBusiness },
] as const;

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading, signUp } = useRegister();

  const [showPassword, setShowPassword] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState<"STUDENT" | "COLLEGE" | "COMPANY">(() => {
    const requestedType = searchParams.get("account_type")?.toUpperCase();
    return requestedType === "COLLEGE" || requestedType === "COMPANY" ? requestedType : "STUDENT";
  });
  const [organization, setOrganization] = useState({
    name: "",
    code: "",
    industry: "",
    website: "",
    headquarters: "",
  });
  const avatar = AI_AVATARS[0].url;

  const { register, control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = useWatch({ control, name: "password" }) || "";

  async function onSubmit(data: RegisterFormData) {
    if (selectedAccountType !== "STUDENT" && organization.name.trim().length < 2) {
      toast.error("Enter an organization name with at least two characters.");
      return;
    }
    if (selectedAccountType === "COLLEGE" && !organization.code.trim()) {
      toast.error("Enter your institution code to continue.");
      return;
    }

    try {
      const result = await signUp({
        ...data,
        avatar,
        account_type: selectedAccountType,
        organization_name: organization.name,
        organization_code: organization.code,
        industry: organization.industry,
        website: organization.website,
        headquarters: organization.headquarters,
      });

      if (result.authenticatedUser) {
        toast.success("Account created successfully.");
        router.replace(getPostLoginPath(result.authenticatedUser));
      } else {
        toast.success("Account created. Please sign in to continue.");
        router.replace("/login");
      }
    } catch (err: unknown) {
      const detail = typeof err === "object" && err !== null && "response" in err
        ? (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
        : undefined;
      const msg = typeof detail === "string"
        ? detail
        : err instanceof Error
          ? err.message
          : "Registration failed. Please check your connection.";
      toast.error(msg.includes("Network Error")
        ? "Registration service is unavailable. Please try again in a moment."
        : msg);
    }
  }

  return (
    <div className="rounded-[30px] border border-white/10 bg-[#0b1220]/90 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.72)] ring-1 ring-white/5 backdrop-blur-xl sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300">Join SkillBattle</p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] text-white">Create your identity.</h1>
        </div>
        <div className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
          1 / 4
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Pick the path that matches you</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {roleOptions.map(({ key, label, detail, Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={selectedAccountType === key}
              onClick={() => setSelectedAccountType(key)}
              className={`flex min-h-[96px] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-center transition ${selectedAccountType === key ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-50 shadow-[0_0_20px_rgba(34,211,238,0.15)]" : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/15 hover:bg-white/[0.04]"}`}
            >
              <Icon size={18} aria-hidden="true" />
              <span className="text-sm font-bold">{label}</span>
              <span className="text-[10px] text-slate-400">{detail}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedAccountType !== "STUDENT" && (
        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-white">{selectedAccountType === "COLLEGE" ? "Institution details" : "Company details"}</h2>
              <p className="mt-1 text-xs text-slate-400">This creates the organization identity. Access is confirmed by the backend after review.</p>
            </div>
            <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">Review</span>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="organization-name" className="mb-2 block text-sm font-medium text-slate-300">{selectedAccountType === "COLLEGE" ? "Institution name" : "Company name"}</label>
              <input id="organization-name" name="organization-name" autoComplete="organization" required minLength={2} value={organization.name} onChange={(event) => setOrganization((current) => ({ ...current, name: event.target.value }))} placeholder={selectedAccountType === "COLLEGE" ? "Northfield Institute" : "SkillBattle Labs"} className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15" />
            </div>

            {selectedAccountType === "COLLEGE" ? (
              <div>
                <label htmlFor="organization-code" className="mb-2 block text-sm font-medium text-slate-300">Institution code</label>
                <input id="organization-code" name="organization-code" required value={organization.code} onChange={(event) => setOrganization((current) => ({ ...current, code: event.target.value.toUpperCase() }))} placeholder="NORTHFIELD" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="company-industry" className="mb-2 block text-sm font-medium text-slate-300">Industry</label>
                  <input id="company-industry" name="industry" value={organization.industry} onChange={(event) => setOrganization((current) => ({ ...current, industry: event.target.value }))} placeholder="Software" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15" />
                </div>
                <div>
                  <label htmlFor="company-website" className="mb-2 block text-sm font-medium text-slate-300">Website</label>
                  <input id="company-website" name="website" type="url" value={organization.website} onChange={(event) => setOrganization((current) => ({ ...current, website: event.target.value }))} placeholder="https://example.com" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="company-headquarters" className="mb-2 block text-sm font-medium text-slate-300">Headquarters</label>
                  <input id="company-headquarters" name="headquarters" value={organization.headquarters} onChange={(event) => setOrganization((current) => ({ ...current, headquarters: event.target.value }))} placeholder="City, country" className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15" />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="register-name" className="mb-2 block text-sm font-medium text-slate-300">Full name</label>
          <input id="register-name" autoComplete="name" {...register("name")} placeholder="Your full name" className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15" />
          {errors.name && <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="register-email" className="mb-2 block text-sm font-medium text-slate-300">Email address</label>
          <input id="register-email" type="email" autoComplete="email" {...register("email")} placeholder="name@example.com" className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15" />
          {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="register-password" className="mb-2 block text-sm font-medium text-slate-300">Password</label>
          <div className="relative">
            <input id="register-password" autoComplete="new-password" type={showPassword ? "text" : "password"} {...register("password")} placeholder="Create a secure password" className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 pr-12 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15" />
            <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-500 transition hover:text-white">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <PasswordStrength password={password} />
          {errors.password && <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="register-confirm-password" className="mb-2 block text-sm font-medium text-slate-300">Confirm password</label>
          <input id="register-confirm-password" type="password" autoComplete="new-password" {...register("confirmPassword")} placeholder="Re-enter your password" className="h-14 w-full rounded-2xl border border-white/10 bg-white/[0.02] px-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/15" />
          {errors.confirmPassword && <p className="mt-2 text-sm text-red-400">{errors.confirmPassword.message}</p>}
        </div>

        <label className="flex items-start gap-3 text-sm text-slate-300">
          <input className="mt-1 accent-cyan-400" type="checkbox" {...register("acceptTerms")} />
          <span>I agree to the <span className="text-cyan-300">Terms & Conditions</span></span>
        </label>
        {errors.acceptTerms && <p className="text-sm text-red-400">{errors.acceptTerms.message}</p>}

        <GradientButton loading={loading} fullWidth type="submit">
          {loading ? "Creating account..." : "Create SkillBattle account"}
        </GradientButton>
      </form>

      <p className="mt-7 text-center text-sm text-slate-400">
        Already have an account?
        <Link href="/login" className="ml-2 font-semibold text-cyan-300 transition hover:text-cyan-200">
          Sign in
        </Link>
      </p>
    </div>
  );
}

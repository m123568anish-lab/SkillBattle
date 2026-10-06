import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn what account, assessment, battle, organization, and profile information SkillBattle processes and how to contact us about privacy requests.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "SkillBattle Privacy Policy", description: "How SkillBattle handles account, assessment, battle, organization, and profile information." },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <article className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
        <Link href="/" className="text-sm font-semibold text-cyan-300 hover:text-white">SkillBattle</Link>
        <h1 className="mt-10 text-4xl font-bold">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-400">Effective October 6, 2026</p>
        <p className="mt-6 leading-7 text-slate-300">This policy describes the information SkillBattle processes to operate its learning, assessment, organization, and hiring workflows. The exact integrations enabled can vary by deployment configuration.</p>
        <section className="mt-9 space-y-7 leading-7 text-slate-300">
          <div><h2 className="text-xl font-semibold text-white">Information we process</h2><p className="mt-2">Account records can include username, name, email, account role, and profile details you choose to provide. Product records can include practice submissions, battle activity, assessment responses and scores, skill evidence, career content, uploaded files, notifications, and organization membership. Company workflows may include job applications and candidate-sharing preferences.</p></div>
          <div><h2 className="text-xl font-semibold text-white">How we use information</h2><p className="mt-2">We use these records to authenticate accounts, operate platform features, calculate and display learning or assessment results, support organization workflows, protect the service, send account notifications, and troubleshoot failures. Passwords are stored as password hashes rather than readable password values.</p></div>
          <div><h2 className="text-xl font-semibold text-white">Candidate privacy and organizations</h2><p className="mt-2">Candidate details are shown to recruiters according to application consent and candidate privacy settings. Organization access is intended to be scoped to the relevant college or company. Information submitted to an organization may also be processed by that organization under its own policies.</p></div>
          <div><h2 className="text-xl font-semibold text-white">AI features and service providers</h2><p className="mt-2">AI-assisted features process the text or files you submit to provide the requested feature. AI providers are selected through server-side deployment configuration; when enabled, relevant inputs may be sent to that provider for processing. Hosting, database, email, and file-storage providers may also process data needed to deliver the service. Do not submit secrets or information you are not authorized to share.</p></div>
          <div><h2 className="text-xl font-semibold text-white">Cookies, local storage, and security</h2><p className="mt-2">The web client stores authentication tokens in browser storage to maintain signed-in sessions. The service also stores refresh-token records to support session renewal and revocation. We use security controls such as password hashing, access checks, rate limits on selected flows, audit records, and transport/security headers; no online service can guarantee absolute security.</p></div>
          <div><h2 className="text-xl font-semibold text-white">Analytics and logs</h2><p className="mt-2">Operational logs and persisted product records may be used to understand platform activity, support administration, and diagnose errors. We do not intentionally include passwords or authentication tokens in product analytics. Assessment answers and private AI conversations are not intended for public display.</p></div>
          <div><h2 className="text-xl font-semibold text-white">Retention and deletion requests</h2><p className="mt-2">Records are retained while needed to operate accounts, organization workflows, security, and audit history. The platform does not currently offer self-service account deletion. Contact us to request account deactivation or deletion review. Organization-owned records, legal/security records, and backups may require separate handling and may not be immediately removed.</p></div>
          <div><h2 className="text-xl font-semibold text-white">Your choices and contact</h2><p className="mt-2">You can update profile and candidate-sharing settings through available account controls. For privacy questions, access or deletion requests, or concerns about your information, email <a className="text-cyan-300 underline" href="mailto:support@skillbattle.app">support@skillbattle.app</a>.</p></div>
        </section>
        <p className="mt-10 text-sm text-slate-400">This policy does not claim a certification or replace advice about your specific legal obligations.</p>
        <Link href="/terms" className="mt-5 inline-flex text-sm text-cyan-300 underline">Read the Terms of Service</Link>
      </article>
      <Footer />
    </main>
  );
}
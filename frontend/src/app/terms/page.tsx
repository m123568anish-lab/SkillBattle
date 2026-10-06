import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Review the terms for using SkillBattle as a student, college, or company, including assessment integrity and platform responsibilities.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "SkillBattle Terms of Service", description: "Terms for students, colleges, and companies using SkillBattle." },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <article className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
        <Link href="/" className="text-sm font-semibold text-cyan-300 hover:text-white">SkillBattle</Link>
        <h1 className="mt-10 text-4xl font-bold">Terms of Service</h1>
        <p className="mt-3 text-sm text-slate-400">Effective October 6, 2026</p>
        <p className="mt-6 leading-7 text-slate-300">By using SkillBattle, you agree to use the platform lawfully, provide accurate account information, and respect the privacy and rights of other users.</p>
        <section className="mt-9 space-y-7 leading-7 text-slate-300">
          <div><h2 className="text-xl font-semibold text-white">Student accounts</h2><p className="mt-2">Students are responsible for their account credentials and for submitting work they are authorized to use. Do not use the platform to impersonate another person, manipulate results, disrupt a battle, or bypass assessment rules.</p></div>
          <div><h2 className="text-xl font-semibold text-white">College accounts</h2><p className="mt-2">College organization features are available after verification. College administrators are responsible for the accuracy of membership and assessment assignments, and may only access information permitted for their organization.</p></div>
          <div><h2 className="text-xl font-semibold text-white">Company accounts</h2><p className="mt-2">Company hiring features require verification. Recruiters must respect candidate consent and privacy settings, use assessment and skill information for legitimate hiring purposes, and keep candidate information appropriately restricted.</p></div>
          <div><h2 className="text-xl font-semibold text-white">Assessments, battles, and AI</h2><p className="mt-2">Assessment and battle outcomes depend on submitted work and the configured rules. AI-generated guidance may be incomplete or incorrect and is not a guarantee of educational, employment, or hiring outcomes. Do not treat AI output as a substitute for professional judgment.</p></div>
          <div><h2 className="text-xl font-semibold text-white">Platform availability and content</h2><p className="mt-2">Features may change, be unavailable, or depend on external services and deployment configuration. You retain responsibility for content you submit and must have the rights needed to submit it. SkillBattle does not guarantee a placement, job, score, ranking, or uninterrupted availability.</p></div>
          <div><h2 className="text-xl font-semibold text-white">Accounts and enforcement</h2><p className="mt-2">We may restrict or suspend accounts when needed to protect users, platform integrity, or security. You may stop using the service at any time. To request account deactivation or deletion review, contact <a className="text-cyan-300 underline" href="mailto:support@skillbattle.app">support@skillbattle.app</a>; organization and audit records may need separate review.</p></div>
          <div><h2 className="text-xl font-semibold text-white">Changes and contact</h2><p className="mt-2">We may update these terms as the platform changes. The effective date above identifies the current published version. Questions can be sent to <a className="text-cyan-300 underline" href="mailto:support@skillbattle.app">support@skillbattle.app</a>.</p></div>
        </section>
        <Link href="/privacy" className="mt-10 inline-flex text-sm text-cyan-300 underline">Read the Privacy Policy</Link>
      </article>
      <Footer />
    </main>
  );
}
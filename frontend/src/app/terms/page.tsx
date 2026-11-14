import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import QubiraLogo from "@/components/brand/QubiraLogo";

export const metadata: Metadata = {
  title: "Terms of Service | Qubira",
  description: "Review the terms for using Qubira as a student, college, or company, including assessment integrity and platform responsibilities.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Qubira Terms of Service", description: "Terms for students, colleges, and companies using Qubira." },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)]">
      <article className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
        <Link href="/" className="inline-block transition-opacity hover:opacity-90">
          <QubiraLogo variant="full" size="sm" />
        </Link>
        <h1 className="mt-10 text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">Effective November 2, 2026</p>
        <p className="mt-6 leading-7 text-[var(--text-secondary)]">By using Qubira, you agree to use the platform lawfully, provide accurate account information, and respect the privacy and rights of other users.</p>
        <section className="mt-9 space-y-7 leading-7 text-[var(--text-secondary)]">
          <div><h2 className="text-xl font-semibold text-[var(--text-primary)]">Student accounts</h2><p className="mt-2">Students are responsible for their account credentials and for submitting work they are authorized to use. Do not use the platform to impersonate another person, manipulate results, disrupt a battle, or bypass assessment rules.</p></div>
          <div><h2 className="text-xl font-semibold text-[var(--text-primary)]">College accounts</h2><p className="mt-2">College organization features are available after verification. College administrators are responsible for the accuracy of membership and assessment assignments, and may only access information permitted for their organization.</p></div>
          <div><h2 className="text-xl font-semibold text-[var(--text-primary)]">Company accounts</h2><p className="mt-2">Company hiring features require verification. Recruiters must respect candidate consent and privacy settings, use assessment and skill information for legitimate hiring purposes, and keep candidate information appropriately restricted.</p></div>
          <div><h2 className="text-xl font-semibold text-[var(--text-primary)]">Assessments, battles, and AI</h2><p className="mt-2">Assessment and battle outcomes depend on submitted work and the configured rules. AI-generated guidance may be incomplete or incorrect and is not a guarantee of educational, employment, or hiring outcomes. Do not treat AI output as a substitute for professional judgment.</p></div>
          <div><h2 className="text-xl font-semibold text-[var(--text-primary)]">Platform availability and content</h2><p className="mt-2">Features may change, be unavailable, or depend on external services and deployment configuration. You retain responsibility for content you submit and must have the rights needed to submit it. Qubira does not guarantee a placement, job, score, ranking, or uninterrupted availability.</p></div>
          <div><h2 className="text-xl font-semibold text-[var(--text-primary)]">Accounts and enforcement</h2><p className="mt-2">We may restrict or suspend accounts when needed to protect users, platform integrity, or security. You may stop using the service at any time. To request account deactivation or deletion review, contact <a className="text-[var(--accent-strong)] hover:text-[var(--accent)] underline" href="mailto:support@qubira.io">support@qubira.io</a>; organization and audit records may need separate review.</p></div>
          <div><h2 className="text-xl font-semibold text-[var(--text-primary)]">Changes and contact</h2><p className="mt-2">We may update these terms as the platform changes. The effective date above identifies the current published version. Questions can be sent to <a className="text-[var(--accent-strong)] hover:text-[var(--accent)] underline" href="mailto:support@qubira.io">support@qubira.io</a>.</p></div>
        </section>
        <Link href="/privacy" className="mt-10 inline-flex text-sm text-[var(--accent-strong)] hover:text-[var(--accent)] underline">Read the Privacy Policy</Link>
      </article>
      <Footer />
    </main>
  );
}

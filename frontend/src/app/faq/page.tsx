import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import QubiraLogo from "@/components/brand/QubiraLogo";

export const metadata: Metadata = {
  title: "Help and FAQ | Qubira",
  description: "Answers about Qubira accounts, coding practice, battles, assessments, AI features, privacy, and organization workflows.",
  alternates: { canonical: "/faq" },
  openGraph: { title: "Qubira Help and FAQ", description: "Answers about using Qubira across student, college, and company workflows." },
};

const topics = [
  ["What is Qubira?", "Qubira is an AI-powered learning and skill development platform combining interactive practice, timed challenges, assessments, verified skill credentials, career tools, and organization workflows in one platform."],
  ["What can a student account do?", "Students can build a profile, practice coding and quizzes, join competitive battles, complete assessments, review skill evidence, and use available career tools."],
  ["How do college accounts work?", "Verified college accounts can manage their organization workflows, including student membership and supported assessments. Access is scoped to the college membership."],
  ["How do company accounts work?", "Company accounts require verification before hiring tools are available. Verified teams can create jobs, discover consented candidates, configure assessments, and manage applications through interview and hiring stages."],
  ["How are battles and assessments evaluated?", "The platform uses persisted submissions and assessment records. Available question types, scoring, and completion behavior depend on the configured assessment or battle."],
  ["What does Qubira Mentor do?", "AI-assisted features can provide coaching and career guidance. Provider availability depends on server configuration; AI output is advisory and is not a hiring or assessment decision."],
  ["How is candidate information shared?", "Recruiter access is controlled by application consent and the candidate's privacy settings. Candidates can manage sharing preferences in their account."],
  ["Can I delete my account in the product?", "There is not currently a self-service account deletion control. Contact support to request account removal or deactivation; organization and audit records may need separate review."],
  ["How do I secure my account?", "Use a unique password and sign out on shared devices. Active-session management is not currently exposed in the account UI; contact support if you believe your account is compromised."],
];

export default function FAQPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
        <Link href="/" className="inline-block transition-opacity hover:opacity-90">
          <QubiraLogo variant="full" size="sm" />
        </Link>
        <h1 className="mt-10 text-4xl font-bold tracking-tight">Help and frequently asked questions</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">Practical answers about accounts, learning, assessments, and organization workflows.</p>
        <div className="mt-10 divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
          {topics.map(([question, answer]) => (
            <details key={question} className="group py-1">
              <summary className="cursor-pointer list-none py-5 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]">
                <span className="flex items-center justify-between gap-3 text-[var(--text-primary)]">
                  {question}
                  <span aria-hidden="true" className="text-[var(--accent-strong)] transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="pb-5 leading-7 text-[var(--text-secondary)]">{answer}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-sm text-[var(--text-muted)]">Need help with your account? <Link className="text-[var(--accent-strong)] hover:text-[var(--accent)] underline" href="/support">Open the support center</Link>.</p>
        <nav className="mt-5 flex gap-5 text-sm"><Link href="/privacy" className="text-[var(--accent-strong)] hover:text-[var(--accent)] underline">Privacy</Link><Link href="/terms" className="text-[var(--accent-strong)] hover:text-[var(--accent)] underline">Terms</Link></nav>
      </div>
      <Footer />
    </main>
  );
}

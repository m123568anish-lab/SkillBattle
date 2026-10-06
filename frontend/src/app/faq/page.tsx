import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Help and FAQ",
  description: "Answers about SkillBattle accounts, coding practice, battles, assessments, AI features, privacy, and organization workflows.",
  alternates: { canonical: "/faq" },
  openGraph: { title: "SkillBattle Help and FAQ", description: "Answers about using SkillBattle across student, college, and company workflows." },
};

const topics = [
  ["What is SkillBattle?", "SkillBattle combines coding practice, timed battles, assessments, skill evidence, career tools, and organization workflows in one platform."],
  ["What can a student account do?", "Students can build a profile, practice problems, join supported battles, complete assessments, review skill evidence, and use available career tools."],
  ["How do college accounts work?", "Verified college accounts can manage their organization workflows, including student membership and supported assessments. Access is scoped to the college membership."],
  ["How do company accounts work?", "Company accounts require verification before hiring tools are available. Verified teams can create jobs, discover consented candidates, configure assessments, and manage applications through interview and hiring stages."],
  ["How are battles and assessments evaluated?", "The platform uses persisted submissions and assessment records. Available question types, scoring, and completion behavior depend on the configured assessment or battle."],
  ["What does SkillBattle AI do?", "AI-assisted features can provide coaching and career guidance. Provider availability depends on server configuration; AI output is advisory and is not a hiring or assessment decision."],
  ["How is candidate information shared?", "Recruiter access is controlled by application consent and the candidate's privacy settings. Candidates can manage sharing preferences in their account."],
  ["Can I delete my account in the product?", "There is not currently a self-service account deletion control. Contact support to request account removal or deactivation; organization and audit records may need separate review."],
  ["How do I secure my account?", "Use a unique password and sign out on shared devices. Active-session management is not currently exposed in the account UI; contact support if you believe your account is compromised."],
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
        <Link href="/" className="text-sm font-semibold text-cyan-300 hover:text-white">SkillBattle</Link>
        <h1 className="mt-10 text-4xl font-bold">Help and frequently asked questions</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">Practical answers about accounts, learning, assessments, and organization workflows.</p>
        <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
          {topics.map(([question, answer]) => <section key={question} className="py-6"><h2 className="text-lg font-semibold">{question}</h2><p className="mt-2 leading-7 text-slate-300">{answer}</p></section>)}
        </div>
        <p className="mt-8 text-sm text-slate-400">Need help with your account? Email <a className="text-cyan-300 underline" href="mailto:support@skillbattle.app">support@skillbattle.app</a>.</p>
        <nav className="mt-5 flex gap-5 text-sm"><Link href="/privacy" className="text-cyan-300 underline">Privacy</Link><Link href="/terms" className="text-cyan-300 underline">Terms</Link></nav>
      </div>
      <Footer />
    </main>
  );
}
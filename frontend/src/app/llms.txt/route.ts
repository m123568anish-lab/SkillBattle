import { NextResponse } from "next/server";

export const dynamic = "force-static";
export const revalidate = 86400; // 24 hours

export async function GET() {
  const content = `# Qubira (https://qubira.in)

> Qubira is an AI-powered competitive learning, technical skill assessment, and engineering career acceleration platform.

## Overview
Qubira empowers student engineers and software developers to master data structures, algorithms, system design, and competitive coding through real-time battles, curated practice roadmaps, and intelligent assessments calibrated against top tier tech company standards.

## Public Resources & Documentation
- [Homepage](https://qubira.in): Platform overview, flagship features, and skill pathways.
- [Frequently Asked Questions](https://qubira.in/faq): Common questions regarding assessments, scoring, practice topics, and user tiers.
- [Support Center](https://qubira.in/support): Technical assistance, feedback channels, and community support.
- [Terms of Service](https://qubira.in/terms): Usage policies, platform conditions, and contest guidelines.
- [Privacy Policy](https://qubira.in/privacy): Data security, privacy practices, and user data governance.

## Core Capabilities
- **Live Battle Arenas**: Multiplayer and 1v1 coding challenges featuring real-time automated judging and multi-language support (Python, C++, JavaScript).
- **Personalized AI Career Roadmaps**: Custom study timelines dynamically aligned with student goals and target placement organizations.
- **Skill Assessment & Verification**: Placement readiness matrix with verified progress metrics, eliminating fabricated statistics.
- **Enterprise & Campus Ecosystems**: Role-based access for colleges, recruiters, and companies conducting standardized evaluations.

## Canonical Domain & Access
- Canonical URL: https://qubira.in
- Sitemap: https://qubira.in/sitemap.xml
- Robots Directive: https://qubira.in/robots.txt
- Contact & Support: support@qubira.in
`;

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}

import { ImageResponse } from "next/og";

export const alt = "SkillBattle coding practice, battles, and hiring platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, color: "#ffffff", background: "linear-gradient(135deg, #07111d 0%, #10253a 58%, #0b1726 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, color: "#6ee7f2", fontSize: 28, fontWeight: 700 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "#0891b2", color: "white" }}>S</div>
          SKILLBATTLE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 66, lineHeight: 1.05, fontWeight: 700, maxWidth: 920 }}>Practice skills. Prove readiness.</div>
          <div style={{ fontSize: 30, color: "#b7cad6" }}>Coding practice · Battles · Assessments · Hiring</div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#8da5b5" }}>Learn and compete with evidence, not guesswork.</div>
      </div>
    ),
    size,
  );
}
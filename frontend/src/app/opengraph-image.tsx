import { ImageResponse } from "next/og";

export const alt = "Qubira — Learn. Build. Compete.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          color: "#ffffff",
          background: "radial-gradient(circle at 15% 20%, #151F38 0%, #080D1A 60%, #04070F 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Geometric Q Icon */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #06B6D4 0%, #6366F1 100%)",
              color: "#080D1A",
              fontSize: 32,
              fontWeight: 900,
              boxShadow: "0 0 30px rgba(6, 182, 212, 0.4)",
            }}
          >
            Q
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em", color: "#ffffff" }}>
              QUBIRA
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.2em", color: "#22D3EE", textTransform: "uppercase" }}>
              Learn. Build. Compete.
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 64, lineHeight: 1.1, fontWeight: 800, maxWidth: 960, letterSpacing: "-0.03em" }}>
            Master technical skills. Solve code. Compete live.
          </div>
          <div style={{ fontSize: 26, color: "#94A3B8" }}>
            Qubira Learn · Qubira Arena · Qubira Code · Interview Prep · Qubira Mentor
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 28 }}>
          <span style={{ fontSize: 20, color: "#64748B" }}>AI-Powered Skill & Engineering Mastery Platform</span>
          <span style={{ fontSize: 20, color: "#06B6D4", fontWeight: 700 }}>qubira.io</span>
        </div>
      </div>
    ),
    size
  );
}

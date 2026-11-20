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
          color: "#F5F7FA",
          background: "#08090B",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Glow Accent Top Right */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "450px",
            height: "450px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(216,255,62,0.18) 0%, rgba(8,9,11,0) 70%)",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 56,
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#D8FF3E",
                color: "#10120A",
                fontSize: 34,
                fontWeight: 900,
                borderRadius: "14px",
              }}
            >
              Q
            </div>
            <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: "0.1em", color: "#F5F7FA" }}>
              QUBIRA
            </span>
          </div>
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#D8FF3E",
              background: "rgba(216,255,62,0.12)",
              padding: "8px 18px",
              borderRadius: "999px",
              border: "1px solid rgba(216,255,62,0.3)",
            }}
          >
            Competitive Learning Platform
          </span>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, zIndex: 10 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#B3BBC7",
            }}
          >
            Engineering Career Preparation
          </span>
          <div
            style={{
              fontSize: 68,
              lineHeight: 1.05,
              fontWeight: 800,
              maxWidth: 980,
              letterSpacing: "-0.04em",
              color: "#F5F7FA",
            }}
          >
            Master Technical Skills. Prove Your Readiness.
          </div>
          <div style={{ fontSize: 24, color: "#7E8998", maxWidth: 840 }}>
            Real-time coding battles · AI study roadmaps · Placement intelligence
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #252B35",
            paddingTop: 24,
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: 16, color: "#7E8998" }}>
            Calibrated for top-tier software engineering hiring.
          </span>
          <span style={{ fontSize: 18, color: "#D8FF3E", fontWeight: 700, letterSpacing: "0.05em" }}>
            qubira.in
          </span>
        </div>
      </div>
    ),
    size,
  );
}

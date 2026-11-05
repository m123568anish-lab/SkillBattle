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
          padding: 76,
          color: "#20231d",
          background: "#f2f0e8",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 54, height: 54, display: "flex", alignItems: "center", justifyContent: "center", background: "#171a14", color: "#c8ef72", fontSize: 33, fontWeight: 800 }}>
              Q
            </div>
            <span style={{ fontSize: 29, fontWeight: 900, letterSpacing: "0.12em" }}>QUBIRA</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>
            Learn · Build · Compete
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#526f20" }}>
            Make your next move count
          </span>
          <div style={{ fontSize: 77, lineHeight: 1.02, fontWeight: 750, maxWidth: 970, letterSpacing: "-0.045em" }}>
            Build skills. Show what you can do.
          </div>
          <div style={{ fontSize: 25, color: "#4c5046" }}>
            Practice · Competition · Career readiness
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #d3d1c5", paddingTop: 22 }}>
          <span style={{ fontSize: 17, color: "#707568" }}>A skill platform for what comes next.</span>
          <span style={{ fontSize: 18, color: "#526f20", fontWeight: 700 }}>qubira.app</span>
        </div>
      </div>
    ),
    size,
  );
}

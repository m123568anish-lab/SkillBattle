import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Qubira — Learn. Build. Compete.",
    short_name: "Qubira",
    description: "AI-powered technical learning, code execution, interview prep, and live developer arena.",
    start_url: "/",
    display: "standalone",
    background_color: "#080D1A",
    theme_color: "#06B6D4",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

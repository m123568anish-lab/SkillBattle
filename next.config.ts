import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  turbopack: {
    root: path.join(__dirname),
  },
  allowedDevOrigins: [
    "192.168.7.2",
  ],
  async rewrites() {
    const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "https://skillbattle-api-2026.onrender.com")
      .replace(/\/+$/, "")
      .replace(/\/api\/v1$/, "");

    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
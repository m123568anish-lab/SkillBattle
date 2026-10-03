import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  async rewrites() {
    const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || "https://skillbattle-api.onrender.com")
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
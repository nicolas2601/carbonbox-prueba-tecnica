import type { NextConfig } from "next";
import { securityHeaders } from "./config/securityHeaders";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  output: process.env.NEXT_STANDALONE === "1" ? "standalone" : undefined,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1", process.env.NODE_ENV) }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

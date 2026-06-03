import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    proxyClientMaxBodySize: 100 * 1024 * 1024, // 100MB
  },
};

export default nextConfig;

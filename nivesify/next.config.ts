import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  turbopack: { root: process.cwd() },
  // THIS IS THE SECRET WEAPON:
  productionBrowserSourceMaps: false,
  experimental: {
    // Reduces memory usage during webpack build
    webpackBuildWorker: true,
  },
};

export default nextConfig;

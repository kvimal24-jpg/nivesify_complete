import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  // THIS IS THE SECRET WEAPON:
  productionBrowserSourceMaps: false,
  experimental: {
    // Reduces memory usage during webpack build
    webpackBuildWorker: true,
  },
};

export default nextConfig;
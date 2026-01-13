import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Next.js 16: Turbopack is now the default bundler
  // Enable experimental features for React 19
  experimental: {
    // React 19 features are enabled by default in Next.js 16
  },
  // Optimize for production
  swcMinify: true,
  // Enable React strict mode for better development experience
  reactStrictMode: true,
};

export default nextConfig;

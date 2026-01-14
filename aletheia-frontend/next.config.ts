import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Next.js 16: Turbopack is now the default bundler
  // Enable experimental features for React 19
  experimental: {
    // React 19 features are enabled by default in Next.js 16
  },
  // In monorepos/workspaces Next can infer the wrong root if there are multiple lockfiles.
  // Setting this removes build warnings and ensures correct path resolution.
  turbopack: {
    // When running `next build` from within the workspace, `process.cwd()` is `aletheia-frontend/`.
    // We want the monorepo root so Turbopack can resolve hoisted deps from the root `node_modules/`.
    root: path.resolve(process.cwd(), ".."),
  },
  // Enable React strict mode for better development experience
  // Note: swcMinify is deprecated in Next.js 16+ (SWC is always enabled)
  reactStrictMode: true,
};

export default nextConfig;

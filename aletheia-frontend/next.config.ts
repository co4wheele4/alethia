import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // Playwright / alternate host hits dev server from 127.0.0.1 while Next binds localhost — avoids noisy warnings.
  allowedDevOrigins: ["http://127.0.0.1:3030", "http://localhost:3030"],
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
    // turbopackIgnore: avoid tracing the whole repo as an NFT dependency (Next.js 16+).
    root: path.resolve(/* turbopackIgnore: true */ process.cwd(), ".."),
  },
  reactStrictMode: true,
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the Turbopack root to this app's directory so Next.js does not
  // infer the repo root from the sibling package-lock.json at the
  // workspace root (this app is an independently owned capstone subtree).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

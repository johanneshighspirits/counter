import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Don't let `next dev` write Next.js instructions into AGENTS.md
  agentRules: false,
  experimental: {
    // Reuse pages for 30 s when navigating back to them, e.g. switching
    // between the counter and stats tabs. Pages update live anyway, and
    // router.refresh() clears this after changes.
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;

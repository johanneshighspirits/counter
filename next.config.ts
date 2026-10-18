import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Don't let `next dev` write Next.js instructions into AGENTS.md
  agentRules: false,
};

export default nextConfig;

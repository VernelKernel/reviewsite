import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  agentRules: false,
  experimental: {
    agentUpgrade: "security",
  },
};

export default nextConfig;

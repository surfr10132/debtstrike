import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-lib", "docx"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

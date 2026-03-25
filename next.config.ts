import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "file-type"],
  images: {
    remotePatterns: [{ hostname: "*.supabase.co" }],
  },
};

export default nextConfig;

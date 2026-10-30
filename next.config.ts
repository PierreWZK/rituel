import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pas de badge Next en dev : il apparaissait sur les captures.
  devIndicators: false,
};

export default nextConfig;

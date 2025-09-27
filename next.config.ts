import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  // Enable this if you want to use Docker in production
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_TOTAL_VOTES_NEEDED: process.env.TOTAL_VOTES_NEEDED,
    NEXT_PUBLIC_SIGN_URL: process.env.SIGN_URL,
  },
};

export default nextConfig;

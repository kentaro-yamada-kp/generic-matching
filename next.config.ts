import type { NextConfig } from "next";

const basePath = process.env.NODE_ENV === "production" ? "/generic-matching" : "";

// Next.js 設定オブジェクト
const nextConfig: NextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;

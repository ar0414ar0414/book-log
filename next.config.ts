import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    staleTimes: {
      dynamic: 0,   // 動的ページを Router Cache に保持しない
      static: 300,  // 静的ページはデフォルトのまま
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/music/:path*",
        destination: "https://arnav-music-library.vercel.app/:path*",
      },
    ];
  },
};

export default nextConfig;

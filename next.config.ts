import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/music",
        destination: "/music/",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/music/",
        destination: "https://arnav-music-library.vercel.app/",
      },
      {
        source: "/music/:path*",
        destination: "https://arnav-music-library.vercel.app/:path*",
      },
    ];
  },
};

export default nextConfig;

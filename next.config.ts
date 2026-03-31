import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
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

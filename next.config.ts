import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for production
  reactStrictMode: true,

  // Reduce bundle size
  compiler: {
    // Remove console.log in production (except errors)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  // Experimental optimizations
  experimental: {
    // Optimize package imports (tree-shake)
    optimizePackageImports: ['socket.io-client', 'qrcode.react'],
  },
};

export default nextConfig;

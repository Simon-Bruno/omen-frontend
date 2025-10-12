import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Optimize for streaming performance
  experimental: {
    // Enable streaming optimizations
    serverComponentsExternalPackages: [],
    // Optimize bundle splitting for better streaming
    optimizePackageImports: ['@assistant-ui/react', '@assistant-ui/react-ai-sdk'],
  },
  // Headers for better streaming performance
  async headers() {
    return [
      {
        source: '/api/chat',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Accel-Buffering',
            value: 'no',
          },
        ],
      },
    ];
  },
};

export default nextConfig;


import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export', // Enable static HTML export
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Disable Next.js image optimization for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Redirects, rewrites, and headers are not supported with static export.
  // If you need redirects, they should be handled by your static hosting provider
  // or by using client-side navigation/meta refresh tags if appropriate.
};

export default nextConfig;

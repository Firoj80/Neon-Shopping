import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    // unoptimized: true, // Removed for non-static export
  },
  // Ensure static export is configured for Capacitor
  // output: 'export', // Removed as Capacitor is removed
  // Set trailingSlash to true if your static server requires it (optional)
  // trailingSlash: true,
};

export default nextConfig;

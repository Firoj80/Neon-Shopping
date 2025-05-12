
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
    unoptimized: true, // Required for static export if using next/image
  },
  // If you are deploying to a static host (like GitHub Pages without a custom server),
  // you might need 'output: "export"'. For dynamic features and server-side logic (even with local storage),
  // this is usually not needed or desired.
  output: 'export', // Ensures static export
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // If you were using output: 'export' for static sites, ensure it's appropriate for your current setup.
  // For a standard dev server, you might not need it.
  // output: 'export',
};

module.exports = nextConfig;

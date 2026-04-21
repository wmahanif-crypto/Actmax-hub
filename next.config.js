/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Removed for API routes support
  trailingSlash: true,
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
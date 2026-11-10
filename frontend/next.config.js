/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/products',
        destination: '/',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/mbbank',
        destination: '/mbbank/index.html',
      },
      {
        source: '/mbbank/admin',
        destination: '/mbbank/admin.html',
      },
      {
        source: '/api/:path*',
        destination: process.env.INTERNAL_BACKEND_URL || 'http://127.0.0.1:3001/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

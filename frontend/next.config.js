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
    ];
  },
};

module.exports = nextConfig;

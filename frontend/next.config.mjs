/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Strict type checking
    strict: true,
  },
  images: {
    unoptimized: true,
  },
  // Vercel-specific optimizations
  compress: true,
  productionBrowserSourceMaps: false,
  swcMinify: true,
  reactStrictMode: true,
  httpAgentOptions: {
    keepAlive: true,
  },
  // Headers for Vercel deployment
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
        ],
      },
    ];
  },
}

export default nextConfig

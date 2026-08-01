import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: true,
  },
  transpilePackages: ['react-map-gl', '@mymeddevices/shared-core', '@mymeddevices/shared-ui', '@mymeddevices/shared-admin'],
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${backendUrl}/api/v1/auth/:path*`,
      },
      {
        source: '/health',
        destination: `${backendUrl}/health`,
      },
      {
        source: '/static/:path*',
        destination: `${backendUrl}/static/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/?login=true',
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      // Seed data images (Unsplash)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Wikipedia (used in some legacy pages)
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        port: '',
        pathname: '/wikipedia/commons/**',
      },
      // Legacy WP images (keep for now in case any local assets reference it)
      {
        protocol: 'https',
        hostname: 'backoffice.mymeddevices.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'www.backoffice.mymeddevices.com',
        port: '',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Checkout and auth routes should not be cached
        source: '/(checkout|dashboard|vendor|reset-password)/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
      {
        // Product and category pages: allow revalidation for SEO crawlers
        source: '/(products|categories)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }],
      },
      {
        // Static pages: cache for longer
        source: '/(about-us|contact-us|privacy-policy|return-policy|shipping-policy|terms-and-conditions)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }],
      },
    ];
  },
};

export default nextConfig;

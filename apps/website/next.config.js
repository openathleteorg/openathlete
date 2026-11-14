/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Lint and types are checked in CI: skipping them here saves build minutes
  // on Vercel's two cores
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  // Social cards render on demand (app/og) from files read at runtime: the
  // page list, the training plans and the logo. Keys are globs too, where
  // `[locale]` would be a character class
  outputFileTracingIncludes: {
    '/og/**': [
      './src/app/**/page.tsx',
      './src/lib/training-plans/plans/**/*.json',
      './public/logo-mark-white.svg',
    ],
  },
  images: {
    // WebP only: each format is a separate transformation, and the Hobby
    // plan's quota counts them
    formats: ['image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      // Published briefly, withdrawn: Strava data is not offered to AI
      // assistants
      {
        source: '/ai/strava',
        destination: '/connect/strava',
        permanent: true,
      },
      {
        source: '/:locale(fr|es|it|pt-br|de)/ai/strava',
        destination: '/:locale/connect/strava',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

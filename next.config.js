/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pypzcnsltqjbnjjohplo.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  rewrites: async () => {
    return [
      {
        source: '/auth',
        destination: '/auth/signin'
      }
    ];
  },
  webpack: (config) => {
    // Exclude Supabase functions from Next.js build
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'https://deno.land/std@0.168.0/http/server.ts': false,
      'https://esm.sh/@supabase/supabase-js@2': false,
    };
    
    return config;
  },
};

module.exports = nextConfig;

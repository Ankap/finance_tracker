/** @type {import('next').NextConfig} */
const nextConfig = {
  // Rewrite all non-API, non-asset paths to index so React Router handles them on reload
  async rewrites() {
    return [
      {
        source: '/((?!api/).*)',
        destination: '/',
      },
    ];
  },

  // Prevent webpack from bundling these Node.js server-side packages
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'openai'];
    }
    return config;
  },
};

module.exports = nextConfig;

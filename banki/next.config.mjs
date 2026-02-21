/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow large image uploads for ID scanning
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  webpack: (config) => {
    // Handle node modules that don't work in browser (TensorFlow etc.)
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;

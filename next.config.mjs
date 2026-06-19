import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
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
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/lib/': path.resolve(__dirname, 'lib/'),
      '@/domain': path.resolve(__dirname, 'src/domain'),
      '@/application': path.resolve(__dirname, 'src/application'),
      '@/infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@/hooks': path.resolve(__dirname, 'app/hooks'),
      '@/hooks/': path.resolve(__dirname, 'app/hooks/'),
      '@/components': path.resolve(__dirname, 'app/components'),
      '@/components/': path.resolve(__dirname, 'app/components/'),
    };
    return config;
  },
};

export default nextConfig;
// next.config.mjs - 简化版
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/**',
      },
    ],
    unoptimized: true,
  },
  
  // 添加空 turbopack 配置以避免错误
  turbopack: {},
  
  // 或者明确指定使用 webpack
  // experimental: {
  //   turbo: false,
  // },
};

export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["lighthouse", "chrome-launcher", "playwright"]
  }
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "lighthouse",
      "chrome-launcher",
      "playwright",
      "@axe-core/playwright",
      "axe-core"
    ]
  }
};

export default nextConfig;

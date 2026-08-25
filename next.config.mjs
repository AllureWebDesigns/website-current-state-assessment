/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "lighthouse",
      "chrome-launcher",
      "playwright",
      "@axe-core/playwright",
      "axe-core"
    ],
    outputFileTracingIncludes: {
      "/api/audit": ["./node_modules/lighthouse/shared/localization/locales/**/*"]
    }
  }
};

export default nextConfig;

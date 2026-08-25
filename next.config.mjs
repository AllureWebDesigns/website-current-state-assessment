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
      "/api/audit": [
        "./node_modules/lighthouse/shared/localization/locales/**/*",
        "./node_modules/lighthouse/report/assets/**/*",
        "./node_modules/lighthouse/flow-report/assets/**/*",
        "./node_modules/lighthouse/dist/report/**/*",
        "./node_modules/axe-core/axe.min.js"
      ]
    }
  }
};

export default nextConfig;

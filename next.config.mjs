/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "lighthouse",
      "chrome-launcher",
      "playwright",
      "playwright-core",
      "@sparticuz/chromium",
      "@axe-core/playwright",
      "axe-core"
    ],
    outputFileTracingIncludes: {
      // Lighthouse dynamically requires many of its own gatherer/audit files via
      // template-literal paths (e.g. `../gather/gatherers/${gathererPath}`), which
      // Next's file tracer can't follow statically. Include the whole package
      // rather than chasing each missing file individually.
      "/api/audit": [
        "./node_modules/lighthouse/**/*",
        "./node_modules/axe-core/axe.min.js",
        "./node_modules/@sparticuz/chromium/bin/**/*"
      ]
    }
  }
};

export default nextConfig;

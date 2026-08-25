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
      // template-literal paths (e.g. `../gather/gatherers/${gathererPath}`), so the
      // file tracer never even analyzes those files to discover the packages THEY
      // import (e.g. http-link-header). Include the whole package plus every
      // package lighthouse itself depends on, rather than chasing each missing
      // file/package one deploy at a time.
      "/api/audit": [
        "./node_modules/lighthouse/**/*",
        "./node_modules/@paulirish/trace_engine/**/*",
        "./node_modules/@sentry/node/**/*",
        "./node_modules/configstore/**/*",
        "./node_modules/csp_evaluator/**/*",
        "./node_modules/devtools-protocol/**/*",
        "./node_modules/enquirer/**/*",
        "./node_modules/http-link-header/**/*",
        "./node_modules/intl-messageformat/**/*",
        "./node_modules/jpeg-js/**/*",
        "./node_modules/js-library-detector/**/*",
        "./node_modules/lighthouse-logger/**/*",
        "./node_modules/lighthouse-stack-packs/**/*",
        "./node_modules/lodash-es/**/*",
        "./node_modules/lookup-closest-locale/**/*",
        "./node_modules/metaviewport-parser/**/*",
        "./node_modules/open/**/*",
        "./node_modules/parse-cache-control/**/*",
        "./node_modules/puppeteer-core/**/*",
        "./node_modules/robots-parser/**/*",
        "./node_modules/speedline-core/**/*",
        "./node_modules/third-party-web/**/*",
        "./node_modules/tldts-icann/**/*",
        "./node_modules/ws/**/*",
        "./node_modules/yargs/**/*",
        "./node_modules/yargs-parser/**/*",
        "./node_modules/axe-core/axe.min.js",
        "./node_modules/@sparticuz/chromium/bin/**/*"
      ]
    }
  }
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'puppeteer-core', '@sparticuz/chromium', 'lighthouse'],
    outputFileTracingIncludes: {
      '/api/scan/**': [
        './node_modules/@sparticuz/chromium/bin/**',
        './node_modules/lighthouse/shared/localization/locales/**'
      ]
    }
  },
  webpack: (config) => {
    config.externals = [
      ...(config.externals || []),
      'puppeteer',
      'puppeteer-core',
      '@sparticuz/chromium',
      'lighthouse'
    ];
    return config;
  }
};
module.exports = nextConfig;

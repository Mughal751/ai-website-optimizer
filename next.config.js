/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // These packages ship native binaries / dynamically require files at
  // runtime (headless Chrome, Lighthouse's audit modules) — keep webpack
  // from trying to statically bundle them so their runtime file lookups
  // still work inside the Vercel function.
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', 'puppeteer-core', '@sparticuz/chromium', 'lighthouse']
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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this project — otherwise Turbopack can pick
    // up an unrelated package-lock.json from a parent directory.
    root: __dirname,
  },
  images: {
    remotePatterns: [
      // Menu item images extracted from the venue's Zillout listing.
      { protocol: 'https', hostname: 'd1hddaam55e99y.cloudfront.net' },
    ],
  },
  async headers() {
    return [
      {
        // public/sw.js (see src/lib/push/subscribeClient.ts) — browsers can
        // cache a service worker script aggressively by default, which
        // would leave customers running a stale worker after a deploy.
        // no-cache forces a revalidation check on every registration.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ];
  },
};

export default nextConfig;

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
};

export default nextConfig;

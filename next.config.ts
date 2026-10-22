import type { NextConfig } from "next";

/**
 * Cache Components / partial prefetching stay off for Phase 1.
 * The app shell uses `usePathname` for nav state; enabling
 * cacheComponents requires Suspense boundaries on every shell consumer.
 * Revisit when adopting ISR-style review detail pages.
 */
const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

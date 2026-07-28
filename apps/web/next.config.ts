import type { NextConfig } from "next";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN;

// Monorepo workspace root for outputFileTracingRoot.
// Required so Next.js traces dependencies outside apps/web correctly
// (e.g. packages/form-contracts) when building the standalone bundle.
const MONOREPO_ROOT = resolve(fileURLToPath(import.meta.url), "../../../");

const nextConfig: NextConfig = {
  // RC-008: Enable standalone output for lightweight Docker image.
  // The runner stage copies only:
  //   apps/web/.next/standalone
  //   apps/web/.next/static
  //   apps/web/public
  // This reduces the Web image from ~1.2 GB to ~300-400 MB.
  output: "standalone",
  // Required for monorepo: trace files outside apps/web into the standalone bundle.
  outputFileTracingRoot: MONOREPO_ROOT,

  reactStrictMode: true,
  // Cho phép /api/* (client-side) proxy về backend khi cần.
  // Khi BACKEND_ORIGIN chưa set, request /api/* sẽ trả 404 (client dùng
  // NEXT_PUBLIC_API_BASE_URL để gọi thẳng backend — đơn giản hơn cho dev).
  async rewrites() {
    if (!BACKEND_ORIGIN) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_ORIGIN.replace(/\/$/, "")}/api/:path*`,
      },
    ];
  },
  // API responses nên qua Next.js (không cache) cho development.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Prisma cần native modules; transpilePackages không cần nhưng set để future-proof.
  transpilePackages: [],
};

export default nextConfig;

import type { NextConfig } from "next";
import path from "node:path";

/** Caminho absoluto normalizado — evita falha do Turbopack com espaços no path (ex.: OneDrive) */
const projectRoot = path.resolve(process.cwd());

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;

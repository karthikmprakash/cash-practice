import type { NextConfig } from "next";

function resolveDistDir() {
  if (process.env.NEXT_DIST_DIR) return process.env.NEXT_DIST_DIR;
  const flag = process.argv.findIndex((arg) => arg === "-p" || arg === "--port");
  const port = flag >= 0 ? process.argv[flag + 1] : process.env.PORT;
  if (port && port !== "3000" && port !== "3001") return `.next-port-${port}`;
  return ".next";
}

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  distDir: resolveDistDir(),
  serverExternalPackages: ["better-sqlite3"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;

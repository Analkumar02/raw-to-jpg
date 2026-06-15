import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["sharp", "archiver", "dcrawr", "dcraw-vendored-win32", "dcraw-vendored-linux", "dcraw-vendored-darwin"],
  experimental: {
    // Allow large file uploads
  },
};

export default nextConfig;

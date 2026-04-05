import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Allow HMR when opening the dev server via LAN/WSL/Docker host IP (see terminal warning). */
  allowedDevOrigins: ["172.29.16.1", "127.0.0.1"],
};

export default nextConfig;

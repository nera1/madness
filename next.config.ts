import type { NextConfig } from "next";

const debug = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: false,
  assetPrefix: debug ? `/` : "",
  basePath: debug ? `` : "",
  trailingSlash: true,
};

export default nextConfig;

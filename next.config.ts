import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only bundled seed images and admin uploads (served from GridFS) may be optimised.
    localPatterns: [
      { pathname: "/images/**", search: "" },
      { pathname: "/api/images/**", search: "" },
    ],
  },
  async redirects() {
    return [{ source: "/admin/hero", destination: "/admin/images", permanent: true }];
  },
};

export default nextConfig;

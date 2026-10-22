import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only admin uploads (served from GridFS) may be optimised.
    localPatterns: [{ pathname: "/api/images/**", search: "" }],
  },
  async redirects() {
    return [{ source: "/admin/hero", destination: "/admin/images", permanent: true }];
  },
};

export default nextConfig;

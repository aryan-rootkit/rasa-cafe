import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Only bundled seed images and processed admin uploads may be optimised.
    localPatterns: [
      { pathname: "/images/**", search: "" },
      { pathname: "/media/**", search: "" },
    ],
  },
};

export default nextConfig;

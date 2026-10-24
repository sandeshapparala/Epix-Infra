import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir:
    process.env.THEATER_BUILD_CHECK === "1"
      ? ".theater-data/build-check"
      : process.env.THEATER_QA === "1"
        ? ".theater-data/next-qa"
        : ".next",
  images: { unoptimized: true },
  outputFileTracingIncludes: {
    "/api/theater/quotes/*/pdf": [
      "./public/logo.png",
      "./public/theater-catalog/quotation/*.jpg",
    ],
  },
  /* config options here */
};

export default nextConfig;

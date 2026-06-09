import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the styled Excel template with the export/import functions on Vercel.
  outputFileTracingIncludes: {
    "/api/excel/export": ["./excel-template/**"],
    "/api/excel/import": ["./excel-template/**"],
  },
};

export default nextConfig;

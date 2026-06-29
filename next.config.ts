import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack (Next.js 16 default) handles WebAssembly natively.
  // No webpack config needed for unpdf/pdfjs-dist WASM support.
  turbopack: {},
};

export default nextConfig;

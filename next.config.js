/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sharp uses native binaries (libheif for AVIF, libjpeg, etc.)
  // Must be listed as external so Next.js doesn't try to bundle it.
  serverExternalPackages: ["sharp"],
};

export default nextConfig;

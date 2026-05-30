import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix Turbopack picking up a stray lockfile in the parent directory
  turbopack: {
    root: __dirname,
  },
  // Native / dynamic-require packages must not be bundled by Next.js
  serverExternalPackages: ["sharp", "firebase-admin"],
};

export default nextConfig;

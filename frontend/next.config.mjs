/** @type {import('next').NextConfig} */
const nextConfig = {
  // Emit a self-contained server bundle for Docker deployments
  output: "standalone",
};

export default nextConfig;

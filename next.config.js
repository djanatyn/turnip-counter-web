/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@slippilab/parser"],
  experimental: {
    urlImports: ["https://cdn.skypack.dev/"],
  },
};

module.exports = nextConfig;

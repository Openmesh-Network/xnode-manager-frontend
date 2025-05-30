/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  rewrites: () => [
    {
      source: "/xnode-forward-insecure/:ip/:call*",
      destination: "http://:ip:34391/:call*",
    },
  ],
  webpack: config => {
    // For reown appkit 
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  }
};

export default nextConfig;

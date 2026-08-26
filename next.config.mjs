/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["shiki"],
  serverExternalPackages: ["mongodb", "bcrypt", "bcryptjs"],
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ["http://192.168.8.109:3001", "192.168.8.109:3001", "192.168.8.109"],
  async redirects() {
    return [
      {
        source: "/m/scan",
        destination: "/dashboard/scans",
        permanent: true,
      },
      {
        source: "/m/chat",
        destination: "/dashboard/chat",
        permanent: true,
      },
      {
        source: "/m/fields",
        destination: "/dashboard/fields",
        permanent: true,
      },
      {
        source: "/m/more",
        destination: "/dashboard/settings",
        permanent: true,
      },
      {
        source: "/m",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
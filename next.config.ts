import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  experimental: { serverActions: { bodySizeLimit: "11mb" } },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/panel", permanent: false },
      {
        source: "/dashboard/new",
        destination: "/panel/cotizar",
        permanent: false,
      },
      {
        source: "/dashboard/orders/:path*",
        destination: "/panel/pedidos/:path*",
        permanent: false,
      },
      {
        source: "/dashboard/calendar",
        destination: "/panel/agenda",
        permanent: false,
      },
      {
        source: "/dashboard/customers/:path*",
        destination: "/panel/clientes/:path*",
        permanent: false,
      },
      {
        source: "/dashboard/settings/:path*",
        destination: "/panel/configuracion",
        permanent: false,
      },
      { source: "/dashboard/:path*", destination: "/panel", permanent: false },
    ];
  },
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;

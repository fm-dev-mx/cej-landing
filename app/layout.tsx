import type { Metadata, Viewport } from "next";
import { env } from "@/config/env";
import { SEO_CONTENT } from "@/config/content";
import "../styles/globals.scss";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e2240",
};

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  title: {
    default: SEO_CONTENT.title,
    template: `%s | ${env.NEXT_PUBLIC_BRAND_NAME}`,
  },
  description: SEO_CONTENT.description,
  keywords: SEO_CONTENT.keywords,
  authors: [{ name: env.NEXT_PUBLIC_BRAND_NAME }],
  creator: env.NEXT_PUBLIC_BRAND_NAME,
  publisher: env.NEXT_PUBLIC_BRAND_NAME,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: SEO_CONTENT.title,
    description: SEO_CONTENT.description,
    url: "/",
    siteName: SEO_CONTENT.siteName,
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: "/opengraph-image.webp?v=1",
        secureUrl: "/opengraph-image.webp?v=1",
        width: 1200,
        height: 630,
        alt: SEO_CONTENT.title,
        type: "image/webp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_CONTENT.title,
    description: SEO_CONTENT.description,
    site: SEO_CONTENT.twitterHandle,
    creator: SEO_CONTENT.twitterHandle,
    images: ["/opengraph-image.webp?v=1"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-MX">
      <body className="app-root">
        {children}

        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

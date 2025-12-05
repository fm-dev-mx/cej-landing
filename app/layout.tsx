// app/layout.tsx
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { env } from "@/config/env";
import { SEO_CONTENT } from "@/config/content";
import "../styles/globals.scss";
import Layout from "@/components/layout/Layout";

// Separate Viewport configuration (Next.js 14+ recommendation)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

const isProduction = process.env.NODE_ENV === "production";
const resolveSiteUrl = (): string => {
  // 1) Prefer explicit public env
  if (env.NEXT_PUBLIC_SITE_URL) {
    return env.NEXT_PUBLIC_SITE_URL;
  }

  // 2) Fallback a dominio de Vercel si existe
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // 3) Fallback local dev
  return "http://localhost:3000";
};

const siteUrl = resolveSiteUrl();

export const metadata: Metadata = {
  // metadataBase is CRITICAL for relative images (e.g. /og-image.jpg) to work
  metadataBase: new URL(siteUrl),

  title: {
    default: SEO_CONTENT.title,
    template: `%s | ${env.NEXT_PUBLIC_BRAND_NAME}`,
  },
  description: SEO_CONTENT.description,
  keywords: SEO_CONTENT.keywords,

  // Configuration for Facebook, LinkedIn, Discord, etc.
  openGraph: {
    title: SEO_CONTENT.title,
    description: SEO_CONTENT.description,
    url: siteUrl,
    siteName: SEO_CONTENT.siteName,
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: SEO_CONTENT.ogImage,
        width: 1200,
        height: 630,
        alt: SEO_CONTENT.title,
      },
    ],
  },

  // Configuration for Twitter/X
  twitter: {
    card: "summary_large_image",
    title: SEO_CONTENT.title,
    description: SEO_CONTENT.description,
    images: [SEO_CONTENT.ogImage],
  },

  icons: {
    icon: "/favicon.ico",
    // apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pixelId = env.NEXT_PUBLIC_PIXEL_ID;

  return (
    <html lang="es-MX">
      <body className="app-root">
        {/* Meta Pixel Code */}
        {isProduction && pixelId && (
          <>
            <Script id="fb-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixelId}');
                fbq('track', 'PageView');
              `}
            </Script>

            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                className="fb-noscript-pixel"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}

        <Layout>{children}</Layout>
      </body>
    </html>
  );
}

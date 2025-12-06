// app/layout.tsx
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { env } from "@/config/env";
import { SEO_CONTENT } from "@/config/content";
import { generateLocalBusinessSchema } from "@/lib/seo";
import "../styles/globals.scss";
import Layout from "@/components/layout/Layout";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

// Use the validated env variable instead of process.env directly
const GA_MEASUREMENT_ID = env.NEXT_PUBLIC_GA_ID;

const resolveSiteUrl = (): string => {
  if (env.NEXT_PUBLIC_SITE_URL) return env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  return "http://localhost:3000";
};

const siteUrl = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  title: {
    default: SEO_CONTENT.title,
    template: `%s | ${env.NEXT_PUBLIC_BRAND_NAME}`,
  },
  description: SEO_CONTENT.description,
  keywords: SEO_CONTENT.keywords,
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
  twitter: {
    card: "summary_large_image",
    title: SEO_CONTENT.title,
    description: SEO_CONTENT.description,
    images: [SEO_CONTENT.ogImage],
  },
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pixelId = env.NEXT_PUBLIC_PIXEL_ID;
  const isProduction = process.env.NODE_ENV === "production";
  const jsonLd = generateLocalBusinessSchema();

  return (
    <html lang="es-MX">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="app-root">
        {/* Google Analytics 4 */}
        {isProduction && GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}

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

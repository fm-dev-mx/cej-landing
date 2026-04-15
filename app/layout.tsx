import type { Metadata, Viewport } from "next";
import Script from "next/script";
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

const GA_MEASUREMENT_ID = env.NEXT_PUBLIC_GA_ID;

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
  const pixelId = env.NEXT_PUBLIC_PIXEL_ID;
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <html lang="es-MX">
      <body className="app-root">
        {/* Scripts Section (GA & Pixel) */}
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

        {isProduction && pixelId && (
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
        )}

        {children}

        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

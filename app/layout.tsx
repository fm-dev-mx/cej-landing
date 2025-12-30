// File: app/layout.tsx
// Description: Root layout with global SEO, analytics, and global UI overlays.

import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { env, isPreview, isDev, APP_ENV } from "@/config/env";
import { SEO_CONTENT } from "@/config/content";

import "../styles/globals.scss";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import GlobalUI from "@/components/layouts/GlobalUI";
import { AuthProvider } from "@/components/auth";

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#021a36",
};

const GA_MEASUREMENT_ID = env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: {
        default: SEO_CONTENT.title,
        template: `%s | ${env.NEXT_PUBLIC_BRAND_NAME}`,
    },
    description: SEO_CONTENT.description,
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const pixelId = env.NEXT_PUBLIC_PIXEL_ID;

    // Tracking is enabled in Production and Preview, but NOT in local Development.
    const enableTracking = !isDev;

    return (
        <html lang="es-MX">
            <body className="app-root">
                {/* Google Analytics + GTM */}
                {enableTracking && GA_MEASUREMENT_ID && (
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
                                  environment: '${APP_ENV}',
                                  is_preview: ${isPreview}
                                });
                            `}
                        </Script>
                    </>
                )}

                {/* Meta / Facebook Pixel */}
                {enableTracking && pixelId && (
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

                {/* App content wrapped with AuthProvider */}
                <AuthProvider>
                    {children}

                    {/* Global UX components (cart, drawer, toast) */}
                    <GlobalUI />
                </AuthProvider>

                {/* Vercel analytics */}
                <SpeedInsights />
                <Analytics />
            </body>
        </html>
    );
}

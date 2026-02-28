// File: app/layout.tsx
// Description: Root layout with global SEO, analytics, and global UI overlays.

import type { Metadata, Viewport } from "next";
import Script from "next/script";

import { env, isPreview, isDev, APP_ENV } from "@/config/env";
import { SEO_CONTENT } from "@/config/content";
import "../styles/globals.scss";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

/** Mirrors `--c-primary-dark` from _tokens.scss for the HTML meta theme tag. */
const META_THEME = '#0e2240';

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: META_THEME,
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

                {children}

                {/* Vercel analytics */}
                <SpeedInsights />
                <Analytics />
            </body>
        </html>
    );
}

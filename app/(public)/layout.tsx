// File: app/(public)/layout.tsx
// Description: Public segment layout with SEO JSON-LD, tracking, and global UI.

import type { ReactNode } from "react";
import { Suspense } from "react";
import Script from "next/script";

import Header from "@/components/layouts/Header/Header";
import Footer from "@/components/layouts/Footer/Footer";
import GlobalUI from "@/components/layouts/GlobalUI";
import SkipLink from "@/components/ui/SkipLink/SkipLink";
import { PageViewTracker } from "@/components/tracking/PageViewTracker";
import { env, isDev } from "@/config/env";
import { generateLocalBusinessSchema } from "@/lib/seo";
import styles from "@/components/layouts/Layout.module.scss";

interface MarketingLayoutProps {
    children: ReactNode;
}

export default function MarketingLayout({
    children,
}: MarketingLayoutProps) {
    const jsonLd = generateLocalBusinessSchema();
    const pixelId = env.NEXT_PUBLIC_PIXEL_ID;
    const enableTracking = !isDev;

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
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
                    `}
                </Script>
            )}
            <Suspense fallback={null}>
                <PageViewTracker />
            </Suspense>
            <SkipLink />
            <Header />
            <main id="main-content" className={styles.mainContent}>{children}</main>
            <Footer />
            <GlobalUI />
        </>
    );
}

// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import { env } from "@/config/env";
import "../styles/globals.scss";
import Layout from "@/components/layout/Layout";

export const metadata: Metadata = {
  title: env.NEXT_PUBLIC_BRAND_NAME,
  description:
    "No te compliques, concreto premezclado y equipos de construcción en Juárez al mejor precio.",
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pixelId = env.NEXT_PUBLIC_PIXEL_ID;
  const isProduction = process.env.NODE_ENV === "production";

  return (
    <html lang="es-MX">
      <body className="app-root">
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

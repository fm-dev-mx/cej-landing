// app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "../styles/globals.scss";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Concreto y Equipos de Juárez",
  description:
    "No te compliques, concreto premezclado y equipos de construcción en Juárez al mejor precio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pid = process.env.NEXT_PUBLIC_PIXEL_ID;
  const isProd = process.env.NODE_ENV === "production";

  return (
    <html lang="es">
      <head>
        {isProd && pid && (
          <>
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s){
                  if(f.fbq)return;
                  n=f.fbq=function(){
                    n.callMethod ?
                    n.callMethod.apply(n,arguments) : n.queue.push(arguments)
                  };
                  if(!f._fbq)f._fbq=n;
                  n.push=n;
                  n.loaded=!0;
                  n.version='2.0';
                  n.queue=[];
                  t=b.createElement(e);
                  t.async=!0;
                  t.src=v;
                  s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)
                }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pid}');
                fbq('track', 'PageView');
              `}
            </Script>
          </>
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {isProd && pid && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${pid}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}
        {children}
      </body>
    </html>
  );
}

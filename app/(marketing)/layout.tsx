// File: app/(marketing)/layout.tsx
// Description: Marketing segment layout with SEO JSON-LD and sticky header.

import type { ReactNode } from "react";

import Header from "@/components/layouts/header/Header";
import Footer from "@/components/layouts/Footer";
import SkipLink from "@/components/ui/SkipLink/SkipLink";
import { generateLocalBusinessSchema } from "@/lib/seo";
import styles from "@/components/layouts/Layout.module.scss";

export default function MarketingLayout({
    children,
}: {
    children: ReactNode;
}) {
    const jsonLd = generateLocalBusinessSchema();

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <SkipLink />
            <Header />
            <main id="main-content" className={styles.mainContent}>{children}</main>
            <Footer />
        </>
    );
}

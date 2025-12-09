// File: app/(marketing)/layout.tsx
// Description: Marketing segment layout with SEO JSON-LD and sticky header.

import type { ReactNode } from "react";

import Header from "@/components/layouts/header/Header";
import Footer from "@/components/layouts/Footer";
import { generateLocalBusinessSchema } from "@/lib/seo";

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
            <Header />
            {/* NOTE: top padding ensures content does not go under fixed header */}
            <main style={{ paddingTop: "var(--header-h)" }}>{children}</main>
            <Footer />
        </>
    );
}

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { generateLocalBusinessSchema } from "@/lib/seo";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const jsonLd = generateLocalBusinessSchema();

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />
            <main style={{ paddingTop: 'var(--header-h)' }}>
                {children}
            </main>
            <Footer />
        </>
    );
}

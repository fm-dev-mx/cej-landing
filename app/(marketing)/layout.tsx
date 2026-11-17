import Header from "@/components/layouts/Header";
import Footer from "@/components/layouts/Footer";
import { generateLocalBusinessSchema } from "@/lib/seo";
import PublicTracking from "./tracking";
import styles from "./layout.module.scss";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = generateLocalBusinessSchema();

  return (
    <>
      <PublicTracking />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className={styles.main}>{children}</main>
      <Footer />
    </>
  );
}

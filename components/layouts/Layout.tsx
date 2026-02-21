// components/layouts/Layout.tsx

import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import styles from "./Layout.module.scss";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <a href="#main" className={styles["layout__skip-link"]}>
        Skip to main content
      </a>

      <Header />

      <main id="main" className={styles.layout}>
        {children}
      </main>

      <Footer />
    </>
  );
}

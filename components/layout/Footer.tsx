// components/layout/Footer.tsx

import Link from "next/link";
import Image from "next/image";
import { env } from "@/config/env";
import styles from "./Footer.module.scss";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>

        {/* Brand Column */}
        <div className={styles.brandCol}>
          <Link href="/" className={styles.logoLink} aria-label="Ir al inicio">
            <Image
              src="/logo.svg"
              alt={env.NEXT_PUBLIC_BRAND_NAME}
              width={140}
              height={40}
              className={styles.logo}
            />
          </Link>
          <p className={styles.tagline}>
            Calidad y resistencia para los cimientos de Ciudad Juárez.
          </p>
          <p className={styles.copyright}>
            © {year} {env.NEXT_PUBLIC_BRAND_NAME}. Todos los derechos reservados.
          </p>
        </div>

        {/* Links Column */}
        <nav className={styles.navCol} aria-label="Legal">
          <ul className={styles.linkList}>
            <li>
              <Link href="/aviso-de-privacidad" className={styles.link}>
                Aviso de Privacidad
              </Link>
            </li>
            <li>
              <Link href="/terminos" className={styles.link}>
                Términos y Condiciones
              </Link>
            </li>
          </ul>
        </nav>

      </div>
    </footer>
  );
}

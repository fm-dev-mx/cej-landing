// components/layout/Footer.tsx

import Link from "next/link";
import { env } from "@/config/env";
import styles from "./Footer.module.scss";

export default function Footer() {
  const year = new Date().getFullYear();
  const whatsappNumber = env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const phoneNumber = env.NEXT_PUBLIC_PHONE;

  return (
    <footer className={styles.footer} id="contact">
      <div className={styles.footer__container}>
        <p className={styles.footer__brand}>
          © {year} {env.NEXT_PUBLIC_BRAND_NAME}
        </p>

        <ul className={styles.footer__links} aria-label="Footer navigation">
          <li className={styles.footer__item}>
            <Link href="/privacy" className={styles.footer__link}>
              Privacy
            </Link>
          </li>
          <li className={styles.footer__item}>
            <Link href="/terms" className={styles.footer__link}>
              Terms
            </Link>
          </li>
          {phoneNumber && (
            <li className={styles.footer__item}>
              <a className={styles.footer__link} href={`tel:+${phoneNumber}`}>
                {phoneNumber}
              </a>
            </li>
          )}
          {whatsappNumber && (
            <li className={styles.footer__item}>
              <a
                className={styles.footer__link}
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </li>
          )}
        </ul>
      </div>
    </footer>
  );
}

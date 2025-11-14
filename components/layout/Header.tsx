// components/layout/Header.tsx

import Link from "next/link";
import styles from "./Header.module.scss";

export default function Header() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE ?? "";

  return (
    <header className={styles.header}>
      <div className={styles.header__container}>
        <div className={styles.header__brand}>
          <Link href="/" aria-label="Concreto y Equipos de Juárez home">
            <span className={styles.header__logo}>CEJ</span>
          </Link>
        </div>

        <nav className={styles.header__nav} aria-label="Main navigation">
          <ul className={styles.header__list}>
            <li className={styles.header__item}>
              <a href="#calculator" className={styles.header__link}>
                Calculator
              </a>
            </li>
            <li className={styles.header__item}>
              <a href="#services" className={styles.header__link}>
                Services
              </a>
            </li>
            <li className={styles.header__item}>
              <a href="#contact" className={styles.header__link}>
                Contact
              </a>
            </li>
          </ul>
        </nav>

        <div className={styles.header__actions}>
          {whatsappNumber && (
            <a
              className={styles["header__btn--outline"]}
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          )}
          {phoneNumber && (
            <a className={styles.header__btn} href={`tel:${phoneNumber}`}>
              Call
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

// components/layout/Header.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.scss";

const PRIMARY_NAV = [
  { href: "#calculator", label: "Calculadora" },
  { href: "#services", label: "Servicios" },
  { href: "#coverage", label: "Cobertura" },
];

const MOBILE_EXTRA_NAV = [{ href: "#faq", label: "FAQ" }];

function getWhatsAppHref(): string | null {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!raw) return null;

  const number = raw.replace(/[^\d]/g, "");
  if (!number) return null;

  const message = encodeURIComponent(
    "Hola, quiero una cotización de concreto premezclado."
  );

  return `https://wa.me/${number}?text=${message}`;
}

function getPhoneHref(): string | null {
  const raw = process.env.NEXT_PUBLIC_PHONE;
  const phone = raw?.trim();
  if (!phone) return null;

  // Simple normalization: remove spaces
  const normalized = phone.replace(/\s+/g, "");
  return `tel:${normalized}`;
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isMenuOpen]);

  const handleCloseMenu = () => setIsMenuOpen(false);

  const waHref = getWhatsAppHref();
  const phoneHref = getPhoneHref();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link
            href="/"
            className={styles.logoLink}
            aria-label="Concreto y Equipos de Juárez"
          >
            <Image
              src="/logo.svg"
              alt="Concreto y Equipos de Juárez"
              width={140}
              height={40}
              className={styles.logo}
              priority
            />
          </Link>
        </div>

        <nav className={styles.nav} aria-label="Navegación principal">
          <ul className={styles.navList}>
            {PRIMARY_NAV.map((item) => (
              <li key={item.href} className={styles.navItem}>
                <a href={item.href} className={styles.navLink}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          {waHref && (
            <a
              href={waHref}
              className={`${styles.button} ${styles.buttonWhatsApp}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          )}

          {phoneHref && (
            <a
              href={phoneHref}
              className={`${styles.button} ${styles.buttonCall}`}
            >
              Llamar
            </a>
          )}
        </div>

        <button
          type="button"
          className={styles.menuToggle}
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMenuOpen}
          aria-controls="main-menu"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className={styles.menuIcon} aria-hidden="true" />
        </button>
      </div>

      <div
        id="main-menu"
        className={`${styles.mobileMenu} ${
          isMenuOpen ? styles.mobileMenuOpen : ""
        }`}
        aria-hidden={!isMenuOpen}
      >
        <nav className={styles.mobileNav} aria-label="Navegación móvil">
          <ul className={styles.mobileNavList}>
            {PRIMARY_NAV.map((item) => (
              <li key={item.href} className={styles.mobileNavItem}>
                <a
                  href={item.href}
                  className={styles.mobileNavLink}
                  onClick={handleCloseMenu}
                >
                  {item.label}
                </a>
              </li>
            ))}

            {MOBILE_EXTRA_NAV.map((item) => (
              <li key={item.href} className={styles.mobileNavItem}>
                <a
                  href={item.href}
                  className={styles.mobileNavLink}
                  onClick={handleCloseMenu}
                >
                  {item.label}
                </a>
              </li>
            ))}

            {waHref && (
              <li className={styles.mobileNavItem}>
                <a
                  href={waHref}
                  className={styles.mobileNavLink}
                  target="_blank"
                  rel="noreferrer"
                  onClick={handleCloseMenu}
                >
                  WhatsApp
                </a>
              </li>
            )}
          </ul>

          {phoneHref && (
            <div className={styles.mobileActions}>
              <a
                href={phoneHref}
                className={`${styles.button} ${styles.buttonCall} ${styles.buttonFull}`}
                onClick={handleCloseMenu}
              >
                Llamar
              </a>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

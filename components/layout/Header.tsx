// components/layout/Header.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.scss";

const PRIMARY_NAV = [
  { href: "#calculator", label: "Calcula tu concreto" },
  { href: "#services", label: "Servicios" },
  { href: "#coverage", label: "Cobertura" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contacto" },
];

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

type PhoneMeta = {
  href: string;
  display: string;
};

function getPhoneMeta(): PhoneMeta | null {
  const raw = process.env.NEXT_PUBLIC_PHONE;
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/\s+/g, "");
  return {
    href: `tel:${normalized}`,
    display: trimmed,
  };
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Shrink header on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Lock scroll and close overlays with Escape
  useEffect(() => {
    const hasOverlayOpen = isMenuOpen || isCallDialogOpen;

    if (!hasOverlayOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsCallDialogOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isMenuOpen, isCallDialogOpen]);

  const handleCloseMenu = () => setIsMenuOpen(false);

  const waHref = getWhatsAppHref();
  const phoneMeta = getPhoneMeta();
  const phoneHref = phoneMeta?.href ?? null;
  const phoneDisplay = phoneMeta?.display ?? "";

  const handleOpenCallDialog = () => {
    if (!phoneHref) return;
    setIsCallDialogOpen(true);
  };

  const handleCloseCallDialog = () => {
    setIsCallDialogOpen(false);
  };

  const headerClassName = [
    styles.header,
    isScrolled ? styles.headerScrolled : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClassName}>
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
              width={180}
              height={48}
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

        {/* Desktop CTAs */}
        <div className={styles.actions}>
          {waHref && (
            <a
              href={waHref}
              className={`${styles.button} ${styles.buttonWhatsApp}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              <span className={styles.buttonWhatsAppLabel}>WhatsApp</span>
            </a>
          )}

          {phoneHref && (
            <button
              type="button"
              className={`${styles.button} ${styles.buttonCall}`}
              onClick={handleOpenCallDialog}
            >
              📞 Llamar
            </button>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          className={styles.menuToggle}
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMenuOpen}
          aria-controls="main-menu"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span
            className={`${styles.menuIcon} ${
              isMenuOpen ? styles.menuIconOpen : ""
            }`}
            aria-hidden="true"
          >
            <span className={styles.menuIconBar} />
            <span className={styles.menuIconBar} />
            <span className={styles.menuIconBar} />
          </span>
        </button>
      </div>

      {/* Mobile overlay + menu */}
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

      {/* Desktop call dialog */}
      {isCallDialogOpen && phoneHref && (
        <div
          className={styles.callDialogOverlay}
          onClick={handleCloseCallDialog}
        >
          <div
            className={styles.callDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="call-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.callDialogHeader}>
              <h2 id="call-dialog-title" className={styles.callDialogTitle}>
                Llamar a Concreto y Equipos de Juárez
              </h2>
              <button
                type="button"
                className={styles.callDialogCloseIcon}
                aria-label="Cerrar"
                onClick={handleCloseCallDialog}
              >
                ×
              </button>
            </div>

            <p className={styles.callDialogSubtitle}>
              Marca para cotizar tu obra o resolver dudas sobre entregas y
              resistencias.
            </p>

            <div className={styles.callDialogPhoneBlock}>
              <a href={phoneHref} className={styles.callDialogPhoneLink}>
                <span className={styles.callDialogPhoneLabel}>Teléfono</span>
                <span className={styles.callDialogPhoneNumber}>
                  {phoneDisplay}
                </span>
              </a>
              <p className={styles.callDialogHint}>
                Si estás en un teléfono, toca el número para iniciar la llamada.
              </p>
            </div>

            <div className={styles.callDialogActions}>
              <button
                type="button"
                className={styles.callDialogCloseButton}
                onClick={handleCloseCallDialog}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

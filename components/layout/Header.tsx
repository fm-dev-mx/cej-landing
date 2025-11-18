// components/layout/Header.tsx
"use client";

import { CSSProperties, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.scss";

type NavItem = {
  href: string;
  label: string;
};

const PRIMARY_NAV: NavItem[] = [
  { href: "#calculator", label: "Calcula tu concreto" },
  { href: "#services", label: "Servicios" },
  { href: "#coverage", label: "Cobertura" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contacto" },
];

const SECTION_IDS = PRIMARY_NAV.map((item) =>
  item.href.startsWith("#") ? item.href.slice(1) : item.href
);

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
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState<string>("calculator");

  // Shrink header on scroll (suave) + estado scrolled
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const maxOffset = 96; // hasta dónde “comprime” el header
      const progress = Math.min(y / maxOffset, 1);

      setScrollProgress(progress);
      setIsScrolled(y > 16);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Scroll spy básico para marcar sección activa
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const sections = SECTION_IDS.map((id) =>
      document.getElementById(id)
    ).filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const top = visible[0];
        if (top?.target.id) {
          setActiveSectionId(top.target.id);
        }
      },
      {
        root: null,
        threshold: [0.2, 0.4, 0.6],
        rootMargin: "-25% 0px -55% 0px",
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
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

  const handleNavItemClick = (href: string, closeMenu?: boolean) => {
    const id = href.startsWith("#") ? href.slice(1) : href;
    setActiveSectionId(id);
    if (closeMenu) {
      handleCloseMenu();
    }
  };

  const headerClassName = [
    styles.header,
    isScrolled ? styles.headerScrolled : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Pasamos el progreso como CSS variable
  const headerStyle: CSSProperties = {
    ["--header-shrink" as string]: scrollProgress,
  };

  return (
    <header className={headerClassName} style={headerStyle}>
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
            {PRIMARY_NAV.map((item) => {
              const sectionId = item.href.startsWith("#")
                ? item.href.slice(1)
                : item.href;

              const isActive = activeSectionId === sectionId;

              return (
                <li key={item.href} className={styles.navItem}>
                  <a
                    href={item.href}
                    className={`${styles.navLink} ${
                      isActive ? styles.navLinkActive : ""
                    }`}
                    onClick={() => handleNavItemClick(item.href)}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
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
            {PRIMARY_NAV.map((item) => {
              const sectionId = item.href.startsWith("#")
                ? item.href.slice(1)
                : item.href;

              const isActive = activeSectionId === sectionId;

              return (
                <li key={item.href} className={styles.mobileNavItem}>
                  <a
                    href={item.href}
                    className={`${styles.mobileNavLink} ${
                      isActive ? styles.mobileNavLinkActive : ""
                    }`}
                    onClick={() => handleNavItemClick(item.href, true)}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Acciones en mobile: WhatsApp (primario) y Llamar (secundario) */}
          <div className={styles.mobileActions}>
            {waHref && (
              <a
                href={waHref}
                className={`${styles.button} ${styles.buttonWhatsApp} ${styles.buttonFull}`}
                target="_blank"
                rel="noreferrer"
                onClick={handleCloseMenu}
              >
                WhatsApp
              </a>
            )}

            {phoneHref && (
              <a
                href={phoneHref}
                className={`${styles.button} ${styles.buttonCall} ${styles.buttonFull}`}
                onClick={handleCloseMenu}
              >
                Llamar
              </a>
            )}
          </div>
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

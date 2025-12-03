// components/layout/Header.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { env } from "@/config/env";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { HeaderCallDialog } from "./HeaderCallDialog";
import styles from "./Header.module.scss";

type NavItem = {
  href: string;
  label: string;
};

const PRIMARY_NAV: NavItem[] = [
  { href: "#calculator", label: "Cotizar" },
  { href: "#services", label: "Servicios" },
  { href: "#projects", label: "Proyectos" },
  { href: "#service-area", label: "Cobertura" },
  { href: "#faq", label: "FAQ" },
];

const SECTION_IDS = PRIMARY_NAV.map((item) =>
  item.href.startsWith("#") ? item.href.slice(1) : item.href
);

function getWhatsAppHref(): string | null {
  const raw = env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!raw) return null;
  const number = raw.replace(/[^\d]/g, "");
  return number
    ? `https://wa.me/${number}?text=${encodeURIComponent(
      "Hola, me interesa una cotización de concreto."
    )}`
    : null;
}

function getPhoneMeta() {
  const raw = env.NEXT_PUBLIC_PHONE;
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  return { href: `tel:${trimmed.replace(/\s+/g, "")}`, display: trimmed };
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // 1. Scroll Spy for active state
  const activeSectionId = useScrollSpy(SECTION_IDS, "calculator");

  // 2. Lock body scroll when mobile menu is open
  useLockBodyScroll(isMenuOpen);

  const waHref = getWhatsAppHref();
  const phoneMeta = getPhoneMeta();

  // Optimized Scroll Listener: Toggle boolean class only
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsScrolled(offset > 20); // Threshold to trigger "stuck" state
    };

    // Check initial state
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavItemClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      <header
        className={`${styles.header} ${isScrolled ? styles.headerScrolled : ""}`}
      >
        <div className={styles.inner}>
          {/* Brand / Logo */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logoLink} aria-label="Inicio">
              <Image
                src="/logo.svg"
                alt={env.NEXT_PUBLIC_BRAND_NAME}
                width={160}
                height={40}
                className={styles.logo}
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className={styles.nav}>
            <ul className={styles.navList}>
              {PRIMARY_NAV.map((item) => {
                const id = item.href.startsWith("#") ? item.href.slice(1) : item.href;
                const isActive = activeSectionId === id;
                return (
                  <li key={item.href} className={styles.navItem}>
                    <a
                      href={item.href}
                      className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                      onClick={handleNavItemClick}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Desktop Actions */}
          <div className={styles.actions}>
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className={`${styles.button} ${styles.buttonWhatsApp}`}
              >
                WhatsApp
              </a>
            )}
            {phoneMeta && (
              <button
                onClick={() => setIsCallDialogOpen(true)}
                className={`${styles.button} ${styles.buttonCall}`}
              >
                Llamar
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className={styles.menuToggle}
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span
              className={`${styles.menuIcon} ${isMenuOpen ? styles.menuIconOpen : ""}`}
            >
              <span className={styles.menuIconBar} />
              <span className={styles.menuIconBar} />
              <span className={styles.menuIconBar} />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        id="mobile-menu"
        className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ""}`}
        aria-hidden={!isMenuOpen}
      >
        <div className={styles.mobileMenuInner}>
          <nav className={styles.mobileNav}>
            <ul className={styles.mobileNavList}>
              {PRIMARY_NAV.map((item) => {
                const id = item.href.startsWith("#") ? item.href.slice(1) : item.href;
                const isActive = activeSectionId === id;
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className={`${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ""}`}
                      onClick={handleNavItemClick}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={styles.mobileActions}>
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noreferrer"
                className={`${styles.button} ${styles.buttonWhatsApp}`}
              >
                WhatsApp
              </a>
            )}
            {phoneMeta && (
              <a href={phoneMeta.href} className={`${styles.button} ${styles.buttonCall}`}>
                Llamar
              </a>
            )}
          </div>
        </div>
      </div>

      <HeaderCallDialog
        isOpen={isCallDialogOpen}
        phoneHref={phoneMeta?.href ?? null}
        phoneDisplay={phoneMeta?.display ?? ""}
        onClose={() => setIsCallDialogOpen(false)}
      />
    </>
  );
}

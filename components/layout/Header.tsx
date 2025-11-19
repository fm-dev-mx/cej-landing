// components/layout/Header.tsx
"use client";

import { CSSProperties, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Header.module.scss";
import { HeaderCallDialog } from "./HeaderCallDialog";

type NavItem = {
  href: string;
  label: string;
};

const PRIMARY_NAV: NavItem[] = [
  { href: "#calculator", label: "Calcula tu concreto" },
  { href: "#services", label: "Servicios" },
  { href: "#service-area", label: "Área de servicio" },
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
  return number ? `https://wa.me/${number}?text=${encodeURIComponent("Hola, quiero una cotización.")}` : null;
}

function getPhoneMeta() {
  const raw = process.env.NEXT_PUBLIC_PHONE;
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  return { href: `tel:${trimmed.replace(/\s+/g, "")}`, display: trimmed };
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState<string>("calculator");

  const waHref = getWhatsAppHref();
  const phoneMeta = getPhoneMeta();

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollProgress(Math.min(y / 120, 1));
      setIsScrolled(y > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Bloquear scroll cuando el menú está abierto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  // Scroll Spy
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActiveSectionId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleNavItemClick = (href: string, closeMenu = false) => {
    const id = href.startsWith("#") ? href.slice(1) : href;
    setActiveSectionId(id);
    if (closeMenu) setIsMenuOpen(false);
  };

  const headerStyle = { "--header-shrink": scrollProgress } as CSSProperties;

  return (
    <>
      {/* Header Principal */}
      <header className={`${styles.header} ${isScrolled ? styles.headerScrolled : ""}`} style={headerStyle}>
        <div className={styles.inner}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logoLink} aria-label="Inicio">
              <Image
                src="/logo.svg"
                alt="CEJ Logo"
                width={180}
                height={48}
                className={styles.logo}
                priority
              />
            </Link>
          </div>

          <nav className={styles.nav}>
            <ul className={styles.navList}>
              {PRIMARY_NAV.map((item) => {
                const id = item.href.startsWith("#") ? item.href.slice(1) : item.href;
                return (
                  <li key={item.href} className={styles.navItem}>
                    <a
                      href={item.href}
                      className={`${styles.navLink} ${activeSectionId === id ? styles.navLinkActive : ""}`}
                      onClick={() => handleNavItemClick(item.href)}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={styles.actions}>
            {waHref && (
              <a href={waHref} target="_blank" rel="noreferrer" className={`${styles.button} ${styles.buttonWhatsApp}`}>
                WhatsApp
              </a>
            )}
            {phoneMeta && (
              <button onClick={() => setIsCallDialogOpen(true)} className={`${styles.button} ${styles.buttonCall}`}>
                Llamar
              </button>
            )}
          </div>

          <button
            type="button"
            className={styles.menuToggle}
            aria-label="Menú"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className={`${styles.menuIcon} ${isMenuOpen ? styles.menuIconOpen : ""}`}>
              <span className={styles.menuIconBar} />
              <span className={styles.menuIconBar} />
              <span className={styles.menuIconBar} />
            </span>
          </button>
        </div>
      </header>

      {/* Menú Móvil (Fuera del Header para evitar clipping) */}
      <div
        id="mobile-menu"
        className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ""}`}
        aria-hidden={!isMenuOpen}
      >
        <nav className={styles.mobileNav}>
          <ul className={styles.mobileNavList}>
            {PRIMARY_NAV.map((item) => {
              const id = item.href.startsWith("#") ? item.href.slice(1) : item.href;
              return (
                <li key={item.href} className={styles.mobileNavItem}>
                  <a
                    href={item.href}
                    className={`${styles.mobileNavLink} ${activeSectionId === id ? styles.mobileNavLinkActive : ""}`}
                    onClick={() => handleNavItemClick(item.href, true)}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Botones de acción DENTRO del menú (porque el menú tapa la sticky bar) */}
          <div className={styles.mobileActions}>
            {waHref && (
              <a href={waHref} target="_blank" rel="noreferrer" className={`${styles.button} ${styles.buttonWhatsApp}`}>
                WhatsApp
              </a>
            )}
            {phoneMeta && (
              <a href={phoneMeta.href} className={`${styles.button} ${styles.buttonCall}`}>
                Llamar
              </a>
            )}
          </div>
        </nav>
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

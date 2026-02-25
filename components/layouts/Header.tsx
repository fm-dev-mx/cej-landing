// components/layouts/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { env } from "@/config/env";
import { useHeaderLogic } from "./Header/useHeaderLogic";
import DesktopNav from "./Header/DesktopNav";
import MobileMenu from "./Header/MobileMenu";
import { WhatsAppIcon } from "@/components/ui/Icon/WhatsAppIcon";
import styles from "./Header.module.scss";

export default function Header() {
  const { state, data, actions } = useHeaderLogic();

  return (
    <>
      <header
        className={`${styles.header} ${state.isScrolled ? styles.headerScrolled : ""
          }`}
      >
        <div className={styles.inner}>
          {/* Brand / Logo */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logoLink} aria-label="Inicio">
              <Image
                src="/logo.svg"
                alt={env.NEXT_PUBLIC_BRAND_NAME}
                width={44}
                height={44}
                className={styles.logo}
                priority
              />
            </Link>
          </div>

          {/* Navigation */}
          <DesktopNav
            navItems={data.navItems}
            activeSectionId={state.activeSectionId}
          />

          {/* Desktop Actions */}
          <div className={styles.actions}>
            {data.waHref && (
              <a
                href={data.waHref}
                target="_blank"
                rel="noreferrer"
                className={`${styles.button} ${styles.buttonWhatsApp}`}
              >
                <WhatsAppIcon size={20} className={styles.buttonIcon} />
                WhatsApp
              </a>
            )}
            {data.phoneMeta && (
              <a
                href={data.phoneMeta.href}
                className={`${styles.button} ${styles.buttonCall}`}
                title="Llamar ahora"
              >
                <span className={styles.buttonIcon}>📞</span>
                {data.phoneMeta.display}
              </a>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className={styles.menuToggle}
            aria-label={state.isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={state.isMenuOpen}
            aria-controls="mobile-menu"
            onClick={actions.toggleMenu}
          >
            <span
              className={`${styles.menuIcon} ${state.isMenuOpen ? styles.menuIconOpen : ""
                }`}
            >
              <span className={styles.menuIconBar} />
              <span className={styles.menuIconBar} />
              <span className={styles.menuIconBar} />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <MobileMenu
        isOpen={state.isMenuOpen}
        navItems={data.navItems}
        activeSectionId={state.activeSectionId}
        waHref={data.waHref}
        phoneMeta={data.phoneMeta}
        onClose={actions.closeMenu}
      />
    </>
  );
}

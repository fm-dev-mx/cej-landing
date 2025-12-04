// components/layout/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { env } from "@/config/env";
import { HeaderCallDialog } from "./HeaderCallDialog";
import { useHeaderLogic } from "./header/useHeaderLogic";
import DesktopNav from "./header/DesktopNav";
import MobileMenu from "./header/MobileMenu";
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
                width={160}
                height={40}
                className={styles.logo}
                priority
              />
            </Link>
          </div>

          {/* Components extracted for separation of concerns */}
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
                WhatsApp
              </a>
            )}
            {data.phoneMeta && (
              <button
                onClick={actions.openCallDialog}
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

      {/* Mobile Menu Overlay Component */}
      <MobileMenu
        isOpen={state.isMenuOpen}
        navItems={data.navItems}
        activeSectionId={state.activeSectionId}
        waHref={data.waHref}
        phoneMeta={data.phoneMeta}
        onClose={actions.closeMenu}
      />

      <HeaderCallDialog
        isOpen={state.isCallDialogOpen}
        phoneHref={data.phoneMeta?.href ?? null}
        phoneDisplay={data.phoneMeta?.display ?? ""}
        onClose={actions.closeCallDialog}
      />
    </>
  );
}

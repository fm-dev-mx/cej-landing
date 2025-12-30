// File: components/layouts/header/Header.tsx
// Description: Main site header with brand, navigation, cart/history access and mobile menu.

"use client";

import Link from "next/link";
import Image from "next/image";

import { env } from "@/config/env";
import { useHeaderLogic } from "./useHeaderLogic";
import DesktopNav from "./DesktopNav";
import MobileMenu from "./MobileMenu";
import { useCejStore } from "@/store/useCejStore";
import { useAuth, UserProfileMenu } from "@/components/auth";

import styles from "./Header.module.scss";

export default function Header() {
  const { state, data, actions } = useHeaderLogic();
  const { user, loading: authLoading } = useAuth();

  const setDrawerOpen = useCejStore((s) => s.setDrawerOpen);
  const setActiveTab = useCejStore((s) => s.setActiveTab);
  const cartCount = useCejStore((s) => s.cart.length);

  const openHistory = () => {
    setActiveTab("history");
    setDrawerOpen(true);
  };

  // Get user display name from metadata or email
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const userEmail = user?.email || '';

  return (
    <>
      <header
        className={`${styles.header} ${state.isScrolled ? styles.headerScrolled : ""
          }`}
      >
        <div className={styles.inner}>
          {/* Brand / Logo */}
          <div className={styles.brand}>
            <Link
              href="/"
              className={styles.logoLink}
              aria-label="Inicio"
            >
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

          {/* Desktop navigation */}
          <DesktopNav
            navItems={data.navItems}
            activeSectionId={state.activeSectionId}
          />

          {/* Desktop actions (auth, history, WhatsApp, call) */}
          <div className={styles.actions}>
            {/* Auth: Show user menu or login link */}
            {!authLoading && (
              user ? (
                <UserProfileMenu userName={userName} userEmail={userEmail} />
              ) : (
                <Link href="/login" className={`${styles.button} ${styles.buttonLogin}`}>
                  Iniciar Sesión
                </Link>
              )
            )}

            <button
              onClick={openHistory}
              className={`${styles.button} ${styles.buttonHistory}`}
              aria-label="Ver mis pedidos"
            >
              📋{" "}
              {cartCount > 0 && (
                <span className={styles.badgeCount}>
                  ({cartCount})
                </span>
              )}
            </button>

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

          {/* Mobile menu toggle */}
          <button
            type="button"
            className={styles.menuToggle}
            onClick={actions.toggleMenu}
            aria-label={state.isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={state.isMenuOpen}
            aria-controls="mobile-menu"
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

      {/* Mobile menu overlay */}
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

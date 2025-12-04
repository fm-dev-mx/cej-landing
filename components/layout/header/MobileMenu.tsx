// components/layout/header/MobileMenu.tsx
import { type NavItem, type PhoneMeta } from "./header.types";
import styles from "../Header.module.scss";

type MobileMenuProps = {
    isOpen: boolean;
    navItems: NavItem[];
    activeSectionId: string;
    waHref: string | null;
    phoneMeta: PhoneMeta | null;
    onClose: () => void;
};

export default function MobileMenu({
    isOpen,
    navItems,
    activeSectionId,
    waHref,
    phoneMeta,
    onClose,
}: MobileMenuProps) {
    return (
        <div
            id="mobile-menu"
            className={`${styles.mobileMenu} ${isOpen ? styles.mobileMenuOpen : ""}`}
            aria-hidden={!isOpen}
        >
            <div className={styles.mobileMenuInner}>
                <nav className={styles.mobileNav}>
                    <ul className={styles.mobileNavList}>
                        {navItems.map((item) => {
                            const id = item.href.startsWith("#")
                                ? item.href.slice(1)
                                : item.href;
                            const isActive = activeSectionId === id;
                            return (
                                <li key={item.href}>
                                    <a
                                        href={item.href}
                                        className={`${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ""
                                            }`}
                                        onClick={onClose}
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
                            rel="noopener noreferrer"
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
    );
}

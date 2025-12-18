// components/layouts/header/MobileMenu.tsx
import { type NavItem, type PhoneMeta } from "./header.types";
import styles from "./Header.module.scss";

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
            // A11y: Dialog semantics for mobile overlay
            role="dialog"
            aria-modal="true"
            aria-hidden={!isOpen}
            aria-label="Menú principal"
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
                                        tabIndex={isOpen ? 0 : -1}
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
                            tabIndex={isOpen ? 0 : -1}
                        >
                            WhatsApp
                        </a>
                    )}
                    {phoneMeta && (
                        <a
                            href={phoneMeta.href}
                            className={`${styles.button} ${styles.buttonCall}`}
                            tabIndex={isOpen ? 0 : -1}
                        >
                            Llamar
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

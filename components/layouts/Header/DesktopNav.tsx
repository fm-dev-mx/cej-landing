// components/layouts/header/DesktopNav.tsx
import { type NavItem } from "./header.types";
import styles from "../Header.module.scss";

type DesktopNavProps = {
    navItems: NavItem[];
    activeSectionId: string;
};

export default function DesktopNav({
    navItems,
    activeSectionId,
}: DesktopNavProps) {
    return (
        <nav className={styles.nav}>
            <ul className={styles.navList}>
                {navItems.map((item) => {
                    const id = item.href.startsWith("#")
                        ? item.href.slice(1)
                        : item.href;
                    const isActive = activeSectionId === id;
                    return (
                        <li key={item.href} className={styles.navItem}>
                            <a
                                href={item.href}
                                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""
                                    }`}
                            >
                                {item.label}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}

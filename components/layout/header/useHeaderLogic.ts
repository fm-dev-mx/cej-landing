// components/layout/header/useHeaderLogic.ts
import { useState, useEffect, useMemo } from "react";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { env } from "@/config/env";
import { PRIMARY_NAV, type PhoneMeta } from "./header.types";

const SECTION_IDS = PRIMARY_NAV.map((item) =>
    item.href.startsWith("#") ? item.href.slice(1) : item.href
);

export function useHeaderLogic() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCallDialogOpen, setIsCallDialogOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    // 1. Scroll Spy for active state
    const activeSectionId = useScrollSpy(SECTION_IDS, "calculator");

    // 2. Lock body scroll when mobile menu is open
    useLockBodyScroll(isMenuOpen);

    // 3. Scroll listener for sticky state
    useEffect(() => {
        const handleScroll = () => {
            const offset = window.scrollY;
            setIsScrolled(offset > 20);
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // 4. Data Helpers (Memoized to prevent unnecessary recalcs)
    const waHref = useMemo(() => {
        const raw = env.NEXT_PUBLIC_WHATSAPP_NUMBER;
        if (!raw) return null;
        const number = raw.replace(/[^\d]/g, "");
        return number
            ? `https://wa.me/${number}?text=${encodeURIComponent(
                "Hola, me interesa una cotización de concreto."
            )}`
            : null;
    }, []);

    const phoneMeta: PhoneMeta | null = useMemo(() => {
        const raw = env.NEXT_PUBLIC_PHONE;
        const trimmed = raw?.trim();
        if (!trimmed) return null;
        return { href: `tel:${trimmed.replace(/\s+/g, "")}`, display: trimmed };
    }, []);

    // 5. Handlers
    const toggleMenu = () => setIsMenuOpen((prev) => !prev);
    const closeMenu = () => setIsMenuOpen(false);
    const openCallDialog = () => setIsCallDialogOpen(true);
    const closeCallDialog = () => setIsCallDialogOpen(false);

    return {
        state: {
            isMenuOpen,
            isCallDialogOpen,
            isScrolled,
            activeSectionId,
        },
        data: {
            waHref,
            phoneMeta,
            navItems: PRIMARY_NAV,
        },
        actions: {
            toggleMenu,
            closeMenu,
            openCallDialog,
            closeCallDialog,
        },
    };
}

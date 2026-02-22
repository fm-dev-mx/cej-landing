// components/layouts/header/useHeaderLogic.ts
import { useState, useEffect } from "react";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { env } from "@/config/env";
import { getPhoneUrl, getWhatsAppUrl } from "@/lib/utils";
import { trackContact } from "@/lib/pixel";
import { PRIMARY_NAV, type PhoneMeta } from "./header.types";

const SECTION_IDS = PRIMARY_NAV.map((item) =>
    item.href.startsWith("#") ? item.href.slice(1) : item.href
);

export function useHeaderLogic() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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

    // 4. Data Helpers
    const waHref = getWhatsAppUrl(
        env.NEXT_PUBLIC_WHATSAPP_NUMBER,
        "Hola, me interesa una cotización de concreto."
    ) ?? null;

    const phoneMeta: PhoneMeta | null = (() => {
        const raw = env.NEXT_PUBLIC_PHONE;
        const href = getPhoneUrl(raw);
        const trimmed = raw?.trim();

        if (!href || !trimmed) return null;

        // Visual formatting: 656 123 4567 (if 10 digits and no spaces)
        const isClean10Digit = /^\d{10}$/.test(trimmed);
        const display = isClean10Digit
            ? trimmed.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")
            : trimmed;

        return { href, display };
    })();

    // 5. Handlers
    const toggleMenu = () => setIsMenuOpen((prev) => !prev);
    const closeMenu = () => setIsMenuOpen(false);

    // Tracking Handlers
    const handleWaClick = () => {
        trackContact('WhatsApp');
    };

    const handlePhoneClick = () => {
        trackContact('Phone');
    };

    return {
        state: {
            isMenuOpen,
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
            handleWaClick,
            handlePhoneClick,
        },
    };
}

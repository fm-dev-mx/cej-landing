// File: components/layouts/GlobalUI.tsx
// Description: Global UI wrapper to mount persistent overlays (toast, drawer, bottom bar).

"use client";

import { useEffect, useState } from "react";

import FeedbackToast from "@/components/ui/FeedbackToast/FeedbackToast";
import QuoteDrawer from "@/components/QuoteDrawer/QuoteDrawer";
import SmartBottomBar from "@/components/SmartBottomBar/SmartBottomBar";

/**
 * GlobalUI
 *
 * - Ensures cart-related feedback (toast, drawer, bottom bar) is always available.
 * - Mounted once at root layout to keep state across route transitions.
 * - Uses hydration guard to avoid server/client mismatch.
 */
export default function GlobalUI() {
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    if (!isHydrated) return null;

    return (
        <>
            <FeedbackToast />
            <QuoteDrawer />
            <SmartBottomBar />
        </>
    );
}

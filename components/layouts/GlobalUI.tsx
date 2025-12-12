// components/layouts/GlobalUI.tsx
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
        /**
         * HYDRATION GUARD PATTERN
         *
         * This component renders client-only children (QuoteDrawer, SmartBottomBar)
         * that depend on Zustand's localStorage state. During SSR, localStorage is
         * undefined, causing a hydration mismatch if we render immediately.
         *
         * Solution: Delay rendering until after hydration by setting state in useEffect.
         * The eslint-disable is intentional - this is the canonical React pattern
         * for "client-only" rendering, per React docs and Next.js guidance.
         *
         * @see https://react.dev/reference/react/useEffect#controlling-a-non-react-widget
         */
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsHydrated(true);

        // Expose store for E2E testing (development only)
        if (process.env.NODE_ENV === 'development') {
            // Dynamic import to avoid bundling store reference in production
            import('@/store/useCejStore').then(({ useCejStore }) => {
                (window as unknown as { useCejStore: typeof useCejStore }).useCejStore = useCejStore;
            });
        }
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

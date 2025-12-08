'use client';

import { useEffect, useState } from 'react';
import FeedbackToast from '@/components/ui/FeedbackToast/FeedbackToast';
import QuoteDrawer from '@/components/QuoteDrawer/QuoteDrawer';
import SmartBottomBar from '@/components/SmartBottomBar/SmartBottomBar';

/**
 * GlobalUI Wrapper
 * Ensures cart feedback components are available on every route (Marketing & App).
 * Handles hydration to prevent mismatch.
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

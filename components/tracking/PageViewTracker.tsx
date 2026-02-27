'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/lib/tracking/visitor';
import { useAttribution } from '@/hooks/useAttribution';

/**
 * Component that tracks page views on route changes.
 * Mounted in the root layout.
 */
export function PageViewTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    useAttribution(); // Ensure UTMs are captured on every page load

    useEffect(() => {
        // Track page view on route change
        trackPageView();
    }, [pathname, searchParams]);

    return null; // Renderless component
}

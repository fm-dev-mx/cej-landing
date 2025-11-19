// hooks/useScrollSpy.ts
import { useEffect, useState } from 'react';

/**
 * Tracks which section is currently active in the viewport.
 * @param sectionIds List of DOM IDs to observe
 * @param offsetRootMargin IntersectionObserver rootMargin (default: "-20% 0px -60% 0px")
 * @returns The ID of the active section
 */
export function useScrollSpy(
    sectionIds: string[],
    defaultActiveId: string = '',
    rootMargin: string = '-20% 0px -60% 0px'
) {
    const [activeId, setActiveId] = useState<string>(defaultActiveId);

    useEffect(() => {
        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                // Sort by intersection ratio to find the "most visible" element
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

                if (visible[0]?.target.id) {
                    setActiveId(visible[0].target.id);
                }
            },
            { rootMargin }
        );

        sectionIds.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [sectionIds, rootMargin]);

    return activeId;
}

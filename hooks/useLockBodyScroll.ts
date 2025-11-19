// hooks/useLockBodyScroll.ts
import { useEffect } from 'react';

/**
 * Locks the body scroll when the condition is true.
 * Useful for modals, mobile menus, etc.
 */
export function useLockBodyScroll(isLocked: boolean) {
    useEffect(() => {
        if (isLocked) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isLocked]);
}

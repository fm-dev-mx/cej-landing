// store/useCejStore.ts
/**
 * @deprecated Use usePublicStore from @/store/public/usePublicStore instead.
 * This file is a bridge to maintain backward compatibility during the Phase 4 migration.
 * It leverages usePublicStore which handles 'cej-public-storage' with migration from 'cej-pro-storage'.
 */
import { usePublicStore } from './public/usePublicStore';

/** @deprecated */
export const useCejStore = usePublicStore;

// Expose legacy name to window for old E2E tests and debugging
if (typeof window !== 'undefined' && (
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_E2E === 'true' ||
    window.location.hostname === 'localhost'
)) {
    (window as unknown as { useCejStore: unknown }).useCejStore = useCejStore;
}

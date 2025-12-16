// tests/global.d.ts
// Type declarations for E2E tests running in browser context

/**
 * Minimal interface for the Zustand store exposed on window.
 * This types the store as exposed by the app for Playwright E2E tests.
 *
 * Note: This is a simplified subset of the actual store types.
 * See types/domain.ts for the full CartItem definition.
 */
interface ExposedCejStore {
    getState: () => {
        editingItemId: string | null;
        cart: Array<{
            id: string;
            timestamp: number;
            config: { label: string };
            results: { total: number; volume: { billedM3: number }; concreteType: string };
            inputs?: Record<string, unknown>;
            customer?: { name: string; phone: string };
            folio?: string;
        }>;
        draft: Record<string, unknown>;
        [key: string]: unknown;
    };
    setState: (partial: Record<string, unknown>) => void;
}

/**
 * Extend the global Window interface for browser context in Playwright tests.
 * This allows typed access to window.useCejStore without using 'any'.
 */
declare global {
    interface Window {
        useCejStore?: ExposedCejStore;
    }
}

export { };

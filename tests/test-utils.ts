// tests/test-utils.ts
import { Page, expect } from '@playwright/test';

/**
 * Waits for the Zustand store to be available on window.
 * Handles race condition where tests run before React hydration completes.
 *
 * @param page - Playwright page object
 * @param timeout - Maximum wait time in ms (default: 5000)
 */
export async function waitForStore(page: Page, timeout = 5000): Promise<void> {
    await page.waitForFunction(
        () => typeof (window as any).useCejStore !== 'undefined',
        { timeout }
    );
}

/**
 * Safely sets store state after ensuring store is available.
 * Use this instead of raw page.evaluate for store manipulation.
 */
export async function setStoreState(page: Page, stateSetter: (store: any) => void): Promise<void> {
    await waitForStore(page);
    await page.evaluate(stateSetter);
}

/**
 * Safely gets store state after ensuring store is available.
 */
export async function getStoreState<T>(page: Page, getter: (store: any) => T): Promise<T> {
    await waitForStore(page);
    return await page.evaluate(getter);
}

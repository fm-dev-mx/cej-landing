// tests/test-utils.ts
// Helpers for Playwright E2E tests.
// See global.d.ts for Window.useCejStore type declaration.

import { Page } from '@playwright/test';

/**
 * Waits for the Zustand store to be available on window.
 * Handles race condition where tests run before React hydration completes.
 *
 * @param page - Playwright page object
 * @param timeout - Maximum wait time in ms (default: 5000)
 */
export async function waitForStore(page: Page, timeout = 5000): Promise<void> {
    await page.waitForFunction(
        () => typeof window.useCejStore !== 'undefined',
        { timeout }
    );
}

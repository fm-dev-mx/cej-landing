import { test, expect } from '@playwright/test';
import { waitForStore } from './test-utils';

test.describe('Checkout Fail-Open Logic', () => {
    test('Should allow WhatsApp redirect even if submitLead fails (Fail-Open)', async ({ page }) => {
        // 1. Initial Load
        await page.goto('/');
        await waitForStore(page);

        // 2. Mock 500 Error for Server Actions
        await page.route('**/*', async (route) => {
            const request = route.request();
            // Next.js App Router actions use POST with 'next-action' header
            if (request.method() === 'POST' && request.headers()['next-action']) {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: "Internal Server Error" })
                });
            } else {
                await route.continue();
            }
        });

        // 3. Inject Full State
        await page.evaluate(() => {
            if (!window.useCejStore) throw new Error("Store not found");
            const mockQuote = {
                total: 100, subtotal: 92, vat: 8, breakdownLines: [],
                volume: { billedM3: 1, requestedM3: 1, roundedM3: 1, minM3ForType: 1, isBelowMinimum: false },
                strength: '200' as const, concreteType: 'direct' as const,
                unitPricePerM3: 92, baseSubtotal: 92, additivesSubtotal: 0
            };
            window.useCejStore.setState({
                draft: { mode: 'knownM3', m3: '1', type: 'direct', strength: '200', workType: 'slab', additives: [] },
                cart: [{
                    id: 'fail-open-item',
                    timestamp: Date.now(),
                    inputs: { m3: '1', type: 'direct', strength: '200', workType: 'slab', additives: [] },
                    results: mockQuote,
                    config: { label: 'Losa' }
                }],
                activeTab: 'order',
                breakdownViewed: true
            });
        });

        // 4. Open Modal
        await page.getByRole('button', { name: /Programar Pedido/i }).click();

        // 5. Fill Modal
        const modal = page.getByRole('dialog');
        await expect(modal).toBeVisible();
        await modal.getByLabel(/Nombre/i).fill('Test User');
        await modal.getByLabel(/Teléfono/i).fill('5512345678');
        await modal.getByPlaceholder(/Calle/i).fill('Av. Fail-Open 500');
        await modal.locator('input[type="date"]').fill('2025-12-25');
        await modal.locator('input[type="checkbox"]').check();

        // 6. Submit and intercept WhatsApp
        const [popup] = await Promise.all([
            page.waitForEvent('popup', { timeout: 15000 }),
            page.locator('button[type="submit"]').click()
        ]);

        // 7. Verify Success via Store State (More robust than text scraping)
        await page.waitForFunction(() => {
            const state = window.useCejStore?.getState();
            return state?.submittedQuote?.folio?.includes('OFFLINE-');
        }, { timeout: 10000 });

        // 8. Final UI check
        await expect(page.getByText(/solicitud ha sido registrada/i)).toBeVisible();

        await popup.close();
    });
});

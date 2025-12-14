import { test, expect } from '@playwright/test';

test.describe('Quote Flow & Progressive Disclosure', () => {

    test('Full flow with Persistence Check (Direct State Injection)', async ({ page, context }) => {
        // 1. Initial Load
        await page.goto('/');

        // 2. Interact with Calculator to ensure it works
        const m3Input = page.getByLabel('Volumen Total (m³)');
        await m3Input.fill('10');

        const viewBreakdownBtn = page.getByRole('button', { name: /Ver Desglose/i });
        await expect(viewBreakdownBtn).toBeVisible();
        await viewBreakdownBtn.click();

        // Check that breakdown appeared
        await expect(page.getByText('Subtotal')).toBeVisible();

        // 3. Simulate Successful Submission (Direct Store Injection)
        // We set the store state directly, which triggers persistence middleware.

        const mockQuote = {
            total: 25000,
            subtotal: 23000,
            vat: 2000,
            breakdownLines: [],
            volume: { billedM3: 10, requestedM3: 10 }
        };

        await page.evaluate((quote) => {
            // @ts-expect-error - we are extending window manually for E2E
            const store = window.useCejStore;
            if (!store) throw new Error('Store not exposed on window');

            store.setState({
                cart: [{
                    id: 'e2e-item-1',
                    timestamp: Date.now(),
                    inputs: { m3: '10', type: 'pumped', strength: '250', workType: 'slab', additives: [] },
                    results: quote,
                    config: { label: 'Losa (Bomba)' },
                    customer: { name: 'E2E Robot', phone: '5599998888' }
                }],
                submittedQuote: {
                    folio: 'E2E-TEST-001',
                    name: 'E2E Robot',
                    results: quote
                },
                breakdownViewed: true,
                draft: { m3: '', additives: [], type: 'pumped', strength: '250', workType: 'slab' },
                activeTab: 'order',
                isDrawerOpen: false
            });

            const newState = store.getState();
            console.log('INJECTED SQUOTE:', newState.submittedQuote ? 'PRESENT' : 'NULL');
            console.log('INJECTED BREAKDOWN:', newState.breakdownViewed);
        }, mockQuote);

        // 4. Verify Immediate UI Update due to React Reactivity
        // Should show "Finalizar orden en WhatsApp" directly
        const whatsappBtn = page.getByRole('button', { name: /Finalizar orden en WhatsApp/i });
        await expect(whatsappBtn).toBeVisible();

        // Should show Folio
        await expect(page.getByText('Folio: E2E-TEST-001')).toBeVisible();

        // 5. Verify Persistence across Reload
        await page.reload();

        // Should STILL show "Finalizar orden en WhatsApp"
        await expect(whatsappBtn).toBeVisible();
        await expect(page.getByText('Folio: E2E-TEST-001')).toBeVisible();

        // 6. Regression Test: Click WhatsApp -> Verify Ticket Persistence in same tab
        const [newPage] = await Promise.all([
            context.waitForEvent('page'),
            whatsappBtn.click()
        ]);

        // Verify new tab is WhatsApp
        await expect(newPage).toHaveURL(/whatsapp.com/);
        await newPage.close();

        // CRITICAL: Verify Ticket is STILL visible (did not flash/disappear)
        await expect(page.getByText('Folio: E2E-TEST-001')).toBeVisible();

        // 7. Verify History Drawer matches injected state
        const historyBtn = page.getByRole('button', { name: /Ver historial/i });
        await historyBtn.click();

        const drawer = page.locator('aside');
        await expect(drawer).toBeVisible();
        await expect(drawer.getByText('E2E Robot')).toBeVisible();
    });

});

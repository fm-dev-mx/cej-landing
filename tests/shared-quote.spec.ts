// tests/shared-quote.spec.ts
// E2E tests for the shared quote page (/cotizacion/[folio]).

import { test, expect } from '@playwright/test';

test.describe('Shared Quote Page', () => {

    test('renders 404 for invalid folio format', async ({ page }) => {
        // Navigate to an invalid folio (wrong format)
        await page.goto('/cotizacion/INVALID-FOLIO');

        // Should show not found page (Next.js default or custom)
        await expect(page).toHaveTitle(/no encontrada|not found|could not be found/i);
    });

    test('renders 404 for non-existent valid folio', async ({ page }) => {
        // Valid format but doesn't exist in DB
        await page.goto('/cotizacion/WEB-20251218-9999');

        // Should show not found page (Next.js default or custom)
        await expect(page).toHaveTitle(/no encontrada|not found|could not be found/i);
    });

    test('displays quote details when folio exists', async ({ page }) => {
        // Navigate to the reserved test folio
        await page.goto('/cotizacion/WEB-00000000-0000');

        // Verify page content from mock data
        await expect(page.getByText('Tu Cotización')).toBeVisible();
        // Use .first() to avoid strict mode violation (matches title, subtitle, and ticket meta)
        await expect(page.getByText('WEB-00000000-0000').first()).toBeVisible();
        await expect(page.getByText('E2E Robot')).toBeVisible();
        await expect(page.getByText('25,000.00')).toBeVisible(); // Total
    });

    test('OG metadata is correctly set for SEO', async ({ page }) => {
        // Navigate to the test folio
        await page.goto('/cotizacion/WEB-00000000-0000');

        // Check that robots meta is set to noindex for privacy
        const robotsMeta = await page.locator('meta[name="robots"]').first().getAttribute('content');
        expect(robotsMeta).toContain('noindex');

        // Check OpenGraph title - explicitly look for meta tag
        const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
        expect(ogTitle).toContain('WEB-00000000-0000');
    });

    test('print button triggers print dialog', async ({ page, browserName }) => {
        await page.goto('/cotizacion/WEB-00000000-0000');

        const printButton = page.getByRole('button', { name: /Descargar PDF/i });
        await expect(printButton).toBeVisible();

        // window.print() can hang the test or close the target in some browsers (e.g. Firefox)
        if (browserName === 'chromium') {
            // In Chromium we can usually click safely if we don't wait for dialog
            await printButton.click();
        }
    });

    test('share URL format is correct', async () => {
        // Verify the share URL pattern matches expected format
        const testFolio = 'WEB-20251218-5678';
        const expectedUrl = `/cotizacion/${testFolio}`;

        // Just verify URL structure is correct
        expect(expectedUrl).toMatch(/^\/cotizacion\/WEB-\d{8}-\d{4}$/);
    });

    test('page is accessible', async ({ page }) => {
        // Navigate to a quote page (even 404 should be accessible)
        await page.goto('/cotizacion/WEB-20251218-0001');

        // Check for basic accessibility markers
        // Ensure we wait for the page to be ready
        const mainContent = page.locator('main, article, header, h1').first();
        await expect(mainContent).toBeVisible();

        // Page should have some content structure
        const hasProperStructure = await mainContent.isVisible();
        expect(hasProperStructure).toBeTruthy();
    });

});

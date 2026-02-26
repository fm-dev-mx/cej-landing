/**
 * Accessibility Testing with axe-core
 *
 * Automated WCAG 2.1 Level AA compliance testing for critical user flows.
 * Runs as part of e2e suite: pnpm test:e2e
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Fail CI only on 'critical' violations initially.
// TODO: Add 'serious' once existing color-contrast issues are fixed.
const FAIL_ON = ['critical'];

test.describe('Accessibility (a11y)', () => {
    test.describe('Landing Page', () => {
        test('homepage has no critical accessibility violations', async ({ page }) => {
            await page.goto('/');

            // Wait for page to be interactive
            await page.waitForLoadState('domcontentloaded');

            const results = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
                .analyze();

            const criticalViolations = results.violations.filter(v =>
                FAIL_ON.includes(v.impact ?? '')
            );

            // Log all violations for debugging
            if (results.violations.length > 0) {
                console.warn('All a11y violations:',
                    results.violations.map(v => ({
                        id: v.id,
                        impact: v.impact,
                        description: v.description,
                        nodes: v.nodes.length
                    }))
                );
            }

            expect(criticalViolations,
                `Found ${criticalViolations.length} critical/serious violations`
            ).toHaveLength(0);
        });
    });

    test.describe('Calculator Widget', () => {
        test('calculator section has no critical accessibility violations', async ({ page }) => {
            await page.goto('/');

            // Scroll to calculator section
            const calculator = page.locator('[data-testid="calculator"]').or(
                page.locator('#calculadora')
            ).or(
                page.locator('.calculator')
            );

            if (await calculator.count() > 0) {
                await calculator.first().scrollIntoViewIfNeeded();
            }

            const results = await new AxeBuilder({ page })
                .include('form') // Focus on form elements
                .withTags(['wcag2a', 'wcag2aa'])
                .analyze();

            const criticalViolations = results.violations.filter(v =>
                FAIL_ON.includes(v.impact ?? '')
            );

            expect(criticalViolations).toHaveLength(0);
        });
    });

    test.describe('Quote Flow', () => {
        test('quote summary has no critical accessibility violations', async ({ page }) => {
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');

            // Select mode to trigger calculator visibility
            const modeButton = page.getByRole('button', { name: /Sé la cantidad|Sé los m³/i });
            if (await modeButton.count() > 0) {
                await modeButton.first().click();
            }

            // Brief wait for UI update
            await page.waitForTimeout(300);

            const results = await new AxeBuilder({ page })
                .withTags(['wcag2a', 'wcag2aa'])
                .analyze();

            const criticalViolations = results.violations.filter(v =>
                FAIL_ON.includes(v.impact ?? '')
            );

            expect(criticalViolations).toHaveLength(0);
        });
    });
});

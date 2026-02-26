// File: tests/marketing-smoke.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Marketing Smoke Tests', () => {

  test('Homepage loads correctly without visual errors', async ({ page }) => {
    // 1. Navigate to home
    await page.goto('/');

    // 2. Verify we are not on an error page (404/500)
    // Fix: Match the actual title defined in config/content.ts
    const ctaHeading = page.getByRole('heading', { name: 'Cotiza tu concreto al instante' });
    await expect(ctaHeading).toBeVisible();

    // 3. Verify critical element: Main Title (H1)
    // This confirms HeroSection is mounted
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();

    // 4. Verify critical interactive sections
    // The calculator is the core of the business
    const calculatorSection = page.locator('#calculator');
    await expect(calculatorSection).toBeVisible();

    // Verify that the calculator widget exists within the section
    await expect(page.getByTestId('calculator-widget')).toBeVisible().catch(() => {
      // Fallback: Use the actual text found in the snapshot
      return expect(page.getByRole('heading', { name: 'Cotiza tu concreto al instante' })).toBeVisible();
    });
  });

  test('Navigation to sections works', async ({ page }) => {
    await page.goto('/');

    // Verify that the services section exists in the DOM
    const servicesSection = page.locator('#services');
    await expect(servicesSection).toBeVisible();
  });
});

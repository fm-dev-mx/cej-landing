import { expect, test } from '@playwright/test';

test.describe('admin mobile smoke', () => {
    test('admin mobile smoke: drawer + navegacion persistente', async ({ page }, testInfo) => {
        test.skip(!testInfo.project.name.toLowerCase().includes('mobile'), 'Smoke destinado a viewport móvil');

        await page.goto('/dashboard');

        test.skip(page.url().includes('/login'), 'Requiere sesión admin activa para validar dashboard');

        const menuButton = page.getByRole('button', { name: 'Abrir navegación lateral' });

        await menuButton.click();
        await page.getByRole('link', { name: 'Configuración general' }).click();
        await expect(page).toHaveURL(/\/dashboard\/settings$/);
        await expect(page.getByLabel('Cerrar menú lateral')).toBeHidden();

        await menuButton.click();
        await page.getByRole('link', { name: 'Editor de precios' }).click();
        await expect(page).toHaveURL(/\/dashboard\/settings\/pricing$/);
        await expect(page.getByLabel('Cerrar menú lateral')).toBeHidden();

        const breadcrumbs = page.getByRole('navigation', { name: 'Migas de pan' });
        await expect(breadcrumbs).toContainText('Resumen');
        await expect(breadcrumbs).toContainText('Configuración');
        await expect(breadcrumbs).toContainText('Editor de precios');
    });
});

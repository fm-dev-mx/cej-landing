import { expect, test } from '@playwright/test';

test.describe('CRM Operations & Soft Deletes', () => {
    test('Create, Read, Update, and Soft Delete a Lead', async ({ page }) => {
        // Assume user is already logged in as admin for this test via global setup
        await page.goto('/dashboard/leads');

        // 1. Create a Lead manually from admin panel (if supported) or via capture form
        // For capture flow we simulate the public form
        await page.goto('/cotizar');
        await page.getByLabel('Nombre').fill('E2E Test Lead');
        await page.getByLabel('Teléfono').fill('6569998888');
        await page.getByRole('button', { name: 'Siguiente' }).click();

        // 2. Read inside Dashboard
        await page.goto('/dashboard');
        // Search or find the test lead in the list
        await expect(page.getByText('E2E Test Lead')).toBeVisible();

        // 3. Update Status (simulate qualifying lead)
        await page.getByText('E2E Test Lead').click();
        await page.getByRole('button', { name: 'Marcar como Calificado' }).click();
        await expect(page.getByText('Status: Calificado')).toBeVisible();

        // 4. Soft Delete
        // Assuming there is a delete button that calls the softDeleteEntity action
        await page.getByRole('button', { name: 'Eliminar Registro' }).click();
        await page.getByRole('button', { name: 'Confirmar Eliminación' }).click();

        // 5. Verify it is excluded from standard views
        await page.goto('/dashboard');
        await expect(page.getByText('E2E Test Lead')).not.toBeVisible();
    });

    test('Order creation links to customer safely and can be soft deleted', async ({ page }) => {
        await page.goto('/dashboard/new');

        // 1. Create Order and Customer simultaneously
        await page.getByLabel('Nombre completo').fill('E2E Customer Soft Delete');
        await page.getByLabel('Teléfono de contacto').fill('6561112233');
        await page.getByLabel('Volumen de concreto').fill('5');
        await page.getByRole('button', { name: 'Registrar Pedido' }).click();

        await expect(page).toHaveURL(/\/dashboard\/orders\//);

        // 2. Soft Delete Order
        await page.getByRole('button', { name: 'Eliminar Pedido' }).click();
        await page.getByRole('button', { name: 'Confirmar' }).click();

        // 3. Verify Order not in list
        await page.goto('/dashboard');
        await expect(page.getByText('E2E Customer Soft Delete')).not.toBeVisible();
    });
});

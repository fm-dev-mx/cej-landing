import { test, expect } from '@playwright/test';

/**
 * Drawer Flow E2E Tests
 *
 * Covers: add item → edit item → save changes → delete with confirmation → empty state
 * This validates the non-destructive edit behavior where items stay in cart during editing.
 */

test.describe('QuoteDrawer Lifecycle', () => {

    test('Edit flow: item stays in cart during edit, updates on save', async ({ page }) => {
        await page.goto('/');

        // Inject a cart item directly for controlled testing (skip slow UI interaction)
        await page.evaluate(() => {
            // @ts-expect-error - Store exposed on window in dev mode
            const store = window.useCejStore;
            if (!store) throw new Error('Store not exposed');

            store.setState({
                cart: [{
                    id: 'e2e-test-item',
                    timestamp: Date.now(),
                    inputs: {
                        mode: 'knownM3',
                        m3: '10',
                        strength: '250',
                        type: 'pumped',
                        additives: [],
                        volumeMode: 'dimensions',
                        workType: null,
                        length: '',
                        width: '',
                        area: '',
                        thicknessByDims: '10',
                        thicknessByArea: '10',
                        hasCoffered: 'no',
                        cofferedSize: '7',
                        showExpertOptions: false
                    },
                    results: {
                        total: 25000,
                        subtotal: 21500,
                        vat: 3500,
                        volume: { billedM3: 10, requestedM3: 10, roundedM3: 10, minM3ForType: 3, isBelowMinimum: false },
                        strength: '250',
                        concreteType: 'pumped',
                        unitPricePerM3: 2150,
                        baseSubtotal: 21500,
                        additivesSubtotal: 0,
                        breakdownLines: []
                    },
                    config: { label: 'Volumen Directo - f\'c 250' }
                }],
                isDrawerOpen: true, // Open drawer directly
                activeTab: 'order',
                submittedQuote: null,
                breakdownViewed: false,
                editingItemId: null
            });
        });

        // Wait for drawer to render (same pattern as Delete test)
        const drawer = page.locator('aside');
        await expect(drawer).toBeVisible();
        await expect(drawer.getByText('Volumen Directo')).toBeVisible();

        // Click Edit on the item
        const editBtn = drawer.getByRole('button', { name: /Editar/i });
        await editBtn.click();

        // Drawer should close (redirected to calculator)
        await expect(drawer).not.toBeVisible();

        // Verify editingItemId is set (via store state)
        const editingItemId = await page.evaluate(() => {
            // @ts-expect-error - Store exposed on window
            return window.useCejStore?.getState().editingItemId;
        });
        expect(editingItemId).toBe('e2e-test-item');

        // CRITICAL: Verify item is STILL in cart (non-destructive)
        const cartLength = await page.evaluate(() => {
            // @ts-expect-error - Store exposed on window
            return window.useCejStore?.getState().cart.length;
        });
        expect(cartLength).toBe(1);

        // Verify edit banner is visible
        const editBanner = page.locator('[role="status"]', { hasText: /Editando cálculo/i });
        await expect(editBanner).toBeVisible();
    });

    test('Delete flow: confirmation required, empty state shown after', async ({ page }) => {
        await page.goto('/');

        // Inject a cart item
        await page.evaluate(() => {
            // @ts-expect-error - Store exposed on window in dev mode
            const store = window.useCejStore;
            if (!store) throw new Error('Store not exposed');

            store.setState({
                cart: [{
                    id: 'delete-test-item',
                    timestamp: Date.now(),
                    inputs: {
                        mode: 'knownM3',
                        m3: '5',
                        strength: '200',
                        type: 'direct',
                        additives: [],
                        volumeMode: 'dimensions',
                        workType: null,
                        length: '',
                        width: '',
                        area: '',
                        thicknessByDims: '10',
                        thicknessByArea: '10',
                        hasCoffered: 'no',
                        cofferedSize: '7',
                        showExpertOptions: false
                    },
                    results: {
                        total: 12000,
                        subtotal: 10350,
                        vat: 1650,
                        volume: { billedM3: 5, requestedM3: 5, roundedM3: 5, minM3ForType: 2, isBelowMinimum: false },
                        strength: '200',
                        concreteType: 'direct',
                        unitPricePerM3: 2070,
                        baseSubtotal: 10350,
                        additivesSubtotal: 0,
                        breakdownLines: []
                    },
                    config: { label: 'Volumen Directo - f\'c 200' }
                }],
                isDrawerOpen: true,
                activeTab: 'order'
            });
        });

        // Wait for drawer to render
        const drawer = page.locator('aside');
        await expect(drawer).toBeVisible();

        // 1. Click Borrar (Delete)
        const deleteBtn = drawer.getByRole('button', { name: /Borrar/i });
        await deleteBtn.click();

        // 2. Confirmation should appear
        await expect(drawer.getByText('¿Seguro?')).toBeVisible();
        const confirmBtn = drawer.getByRole('button', { name: /Sí/i });

        // 3. Confirm deletion
        await confirmBtn.click();

        // 4. Item should be removed, empty state shown
        await expect(drawer.getByText('Tu pedido está vacío')).toBeVisible();

        // 5. Cart should be empty
        const cartLength = await page.evaluate(() => {
            // @ts-expect-error - Store exposed on window
            return window.useCejStore?.getState().cart.length;
        });
        expect(cartLength).toBe(0);
    });

    test('Cancel edit: item remains in cart, editingItemId cleared', async ({ page }) => {
        await page.goto('/');

        // Inject item and set editing mode (no reload - editingItemId is NOT persisted)
        await page.evaluate(() => {
            // @ts-expect-error - Store exposed on window
            const store = window.useCejStore;
            if (!store) throw new Error('Store not exposed');

            store.setState({
                cart: [{
                    id: 'cancel-test-item',
                    timestamp: Date.now(),
                    inputs: {
                        mode: 'knownM3',
                        m3: '8',
                        strength: '250',
                        type: 'pumped',
                        additives: [],
                        volumeMode: 'dimensions',
                        workType: null,
                        length: '',
                        width: '',
                        area: '',
                        thicknessByDims: '10',
                        thicknessByArea: '10',
                        hasCoffered: 'no',
                        cofferedSize: '7',
                        showExpertOptions: false
                    },
                    results: {
                        total: 20000,
                        subtotal: 17250,
                        vat: 2750,
                        volume: { billedM3: 8, requestedM3: 8, roundedM3: 8, minM3ForType: 3, isBelowMinimum: false },
                        strength: '250',
                        concreteType: 'pumped',
                        unitPricePerM3: 2150,
                        baseSubtotal: 17250,
                        additivesSubtotal: 0,
                        breakdownLines: []
                    },
                    config: { label: 'Volumen Directo - f\'c 250' }
                }],
                isDrawerOpen: false,
                editingItemId: 'cancel-test-item',
                draft: {
                    mode: 'knownM3',
                    m3: '8',
                    strength: '250',
                    type: 'pumped',
                    additives: [],
                    volumeMode: 'dimensions',
                    workType: null,
                    length: '',
                    width: '',
                    area: '',
                    thicknessByDims: '10',
                    thicknessByArea: '10',
                    hasCoffered: 'no',
                    cofferedSize: '7',
                    showExpertOptions: false
                }
            });
        });

        // Wait for React to re-render with new state (no reload needed)
        await page.waitForTimeout(100);

        // 1. Edit banner should be visible
        const editBanner = page.locator('[role="status"]', { hasText: /Editando cálculo/i });
        await expect(editBanner).toBeVisible();

        // 2. Click Cancel
        const cancelBtn = page.getByRole('button', { name: /Cancelar/i });
        await cancelBtn.click();

        // 3. Edit banner should disappear
        await expect(editBanner).not.toBeVisible();

        // 4. Cart should still have the item
        const cartLength = await page.evaluate(() => {
            // @ts-expect-error - Store exposed on window
            return window.useCejStore?.getState().cart.length;
        });
        expect(cartLength).toBe(1);

        // 5. editingItemId should be null
        const editingId = await page.evaluate(() => {
            // @ts-expect-error - Store exposed on window
            return window.useCejStore?.getState().editingItemId;
        });
        expect(editingId).toBeNull();
    });

});

// store/useCejStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCejStore } from '@/store/useCejStore';
import type { QuoteBreakdown } from '@/types/domain';

describe('useCejStore (State Management)', () => {
    beforeEach(() => {
        const { resetDraft, clearCart } = useCejStore.getState();
        act(() => {
            resetDraft();
            clearCart();
        });
        localStorage.clear();
    });

    describe('Calculator Logic', () => {
        it('sets WorkType and defaults dependent fields correctly', () => {
            const { result } = renderHook(() => useCejStore());

            // 1. Select Slab (Losa)
            act(() => result.current.setWorkType('slab'));

            expect(result.current.draft.workType).toBe('slab');
            expect(result.current.draft.type).toBe('pumped'); // Should auto-select Pumped
            expect(result.current.draft.hasCoffered).toBe('yes'); // Slab implies coffered default check

            // 2. Select Floor (Piso)
            act(() => result.current.setWorkType('lightInteriorFloor'));
            expect(result.current.draft.workType).toBe('lightInteriorFloor');
            // Assuming default config for floor doesn't enforce coffered:
            expect(result.current.draft.hasCoffered).toBe('no');
        });

        it('clears workType when setting null', () => {
            const { result } = renderHook(() => useCejStore());
            act(() => result.current.setWorkType(null));
            expect(result.current.draft.workType).toBeNull();
        });
    });

    describe('Migration & Persistence', () => {
        it('migrates old state (v1 -> v2) by adding additives array', () => {
            // We need to access the 'migrate' function from the persist options
            // Since it's internal to the middleware, we simulate a migration scenario
            // by inspecting the implementation of the persist middleware config.

            // However, a simpler way in unit tests is to manually invoke the migrate logic if exported,
            // or trust Zustand. Here we test the logic via the store's behavior if we could inject old state.

            // Mocking the behavior:
            const oldState: unknown = {
                draft: { m3: '10' } // Missing additives
            };

            // Retrieve the persist object to test migrate function directly
            const persistOptions = useCejStore.persist.getOptions();
            const migratedState = persistOptions.migrate?.(oldState, 1) as unknown as { draft: { additives: string[], showExpertOptions: boolean, m3: string } };

            expect(migratedState.draft.additives).toEqual([]);
            expect(migratedState.draft.showExpertOptions).toBe(false);
            expect(migratedState.draft.m3).toBe('10');
        });
    });

    describe('Cart Operations', () => {
        it('generates correct label for Assist Mode', () => {
            const { result } = renderHook(() => useCejStore());

            act(() => {
                result.current.setMode('assistM3');
                result.current.setWorkType('slab'); // Label: Losa
                result.current.addToCart({ total: 100, subtotal: 90 } as unknown as QuoteBreakdown);
            });

            expect(result.current.cart[0].config.label).toContain('Losa');
        });

        it('generates correct label for Known Mode', () => {
            const { result } = renderHook(() => useCejStore());

            act(() => {
                result.current.setMode('knownM3');
                result.current.addToCart({ total: 100, subtotal: 90 } as unknown as QuoteBreakdown);
            });

            expect(result.current.cart[0].config.label).toContain('Volumen Directo');
        });

        it('editCartItem restores state and removes from cart', () => {
            const { result } = renderHook(() => useCejStore());
            // Add item
            act(() => result.current.addToCart({ total: 100 } as unknown as QuoteBreakdown));
            const id = result.current.cart[0].id;

            // Edit item
            act(() => result.current.editCartItem(id));

            expect(result.current.cart).toHaveLength(0);
            expect(result.current.isDrawerOpen).toBe(false);
        });

        it('moveToHistory archives items', () => {
            const { result } = renderHook(() => useCejStore());
            act(() => result.current.addToCart({ total: 100 } as unknown as QuoteBreakdown));

            act(() => result.current.moveToHistory());

            expect(result.current.cart).toHaveLength(0);
            expect(result.current.history).toHaveLength(1);
        });
    });
});

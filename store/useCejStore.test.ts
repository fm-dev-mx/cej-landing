import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCejStore } from '@/store/useCejStore';
import { DEFAULT_CALCULATOR_STATE } from '@/types/domain';

// Mock persist middleware behavior if needed,
// but for unit tests we generally test the reducer logic.
// We will rely on Zustand's default behavior in JSDOM.

describe('useCejStore (State Management)', () => {

    beforeEach(() => {
        // Reset store before each test
        const { resetDraft, clearCart } = useCejStore.getState();
        act(() => {
            resetDraft();
            clearCart();
        });
    });

    describe('Draft / Calculator Slice', () => {
        it('initializes with default state', () => {
            const { result } = renderHook(() => useCejStore());
            expect(result.current.draft).toEqual(DEFAULT_CALCULATOR_STATE);
        });

        it('updates draft fields correctly', () => {
            const { result } = renderHook(() => useCejStore());

            act(() => {
                result.current.updateDraft({ m3: '10', strength: '250' });
            });

            expect(result.current.draft.m3).toBe('10');
            expect(result.current.draft.strength).toBe('250');
        });

        it('resets logic when changing Mode', () => {
            const { result } = renderHook(() => useCejStore());

            // Set some state in Assist mode
            act(() => {
                result.current.setMode('assistM3');
                result.current.updateDraft({ m3: '50' }); // Should be cleared on mode switch
            });

            // Switch to Known Mode
            act(() => {
                result.current.setMode('knownM3');
            });

            expect(result.current.draft.mode).toBe('knownM3');
            expect(result.current.draft.workType).toBeNull();
            // Assuming setMode logic clears irrelevant fields:
            // "if mode === 'knownM3' ... nextDraft.workType = null"
        });

        it('toggles additives idempotently', () => {
            const { result } = renderHook(() => useCejStore());

            // Add
            act(() => result.current.toggleAdditive('fiber'));
            expect(result.current.draft.additives).toContain('fiber');

            // Remove
            act(() => result.current.toggleAdditive('fiber'));
            expect(result.current.draft.additives).not.toContain('fiber');
        });

        it('clears additives when expert mode is disabled', () => {
            const { result } = renderHook(() => useCejStore());

            act(() => {
                result.current.setExpertMode(true);
                result.current.toggleAdditive('fiber');
            });
            expect(result.current.draft.additives).toHaveLength(1);

            act(() => {
                result.current.setExpertMode(false);
            });
            expect(result.current.draft.additives).toHaveLength(0);
        });
    });

    describe('Cart / Order Slice', () => {
        it('adds a quote to the cart', () => {
            const { result } = renderHook(() => useCejStore());

            const mockQuote: any = { total: 5000, subtotal: 4000 };

            act(() => {
                result.current.updateDraft({ m3: '5', strength: '200' });
                result.current.addToCart(mockQuote);
            });

            expect(result.current.cart).toHaveLength(1);
            expect(result.current.cart[0].results.total).toBe(5000);
            expect(result.current.isDrawerOpen).toBe(true);

            // Draft should be reset after adding to cart
            expect(result.current.draft.m3).toBe('');
        });

        it('removes item from cart', () => {
            const { result } = renderHook(() => useCejStore());
            const mockQuote: any = { total: 100 };

            act(() => {
                result.current.addToCart(mockQuote);
            });
            const id = result.current.cart[0].id;

            act(() => {
                result.current.removeFromCart(id);
            });
            expect(result.current.cart).toHaveLength(0);
        });
    });
});

// store/useCejStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useCejStore } from './useCejStore';
import { DEFAULT_CALCULATOR_STATE } from '@/types/domain';

// QA NOTE: We do NOT mock the store module.
// We test the real Zustand store logic to ensure actions actually update the state.

describe('Zustand Store Logic', () => {
    // Reset the store state before each test to ensure isolation
    beforeEach(() => {
        useCejStore.setState({
            draft: { ...DEFAULT_CALCULATOR_STATE },
            cart: [],
            history: [],
            isDrawerOpen: false,
            activeTab: 'order',
            user: {
                visitorId: 'test-visitor',
                hasConsentedPersistence: true
            }
        });
    });

    it('initializes with default state', () => {
        const state = useCejStore.getState();
        expect(state.draft).toEqual(DEFAULT_CALCULATOR_STATE);
        expect(state.cart).toEqual([]);
    });

    it('toggles Expert Mode correctly and clears additives when disabled', () => {
        const store = useCejStore.getState();

        // 1. Enable expert mode
        store.setExpertMode(true);
        expect(useCejStore.getState().draft.showExpertOptions).toBe(true);

        // 2. Add additive
        store.toggleAdditive('fiber');
        expect(useCejStore.getState().draft.additives).toContain('fiber');

        // 3. Disable expert mode (should clear additives)
        store.setExpertMode(false);
        expect(useCejStore.getState().draft.showExpertOptions).toBe(false);
        expect(useCejStore.getState().draft.additives).toEqual([]);
    });

    it('addToCart adds item and resets draft', () => {
        const store = useCejStore.getState();

        // 1. Modify draft
        store.updateDraft({ m3: '10' });

        // 2. Mock Quote Result (Partial)
        const mockQuote: any = {
            total: 1000,
            volume: { billedM3: 10 },
            concreteType: 'direct'
        };

        // 3. Add to cart
        store.addToCart(mockQuote);

        const newState = useCejStore.getState();

        // Verify Cart
        expect(newState.cart).toHaveLength(1);
        expect(newState.cart[0].results).toEqual(mockQuote);
        expect(newState.cart[0].inputs.m3).toBe('10');

        // Verify Draft Reset
        expect(newState.draft).toEqual(DEFAULT_CALCULATOR_STATE);

        // Verify UI effect
        expect(newState.isDrawerOpen).toBe(true);
    });

    it('removeFromCart removes correct item', () => {
        const store = useCejStore.getState();

        const mockQuote: any = { total: 500 };

        // Add 2 items
        store.addToCart(mockQuote); // Item 1
        store.addToCart(mockQuote); // Item 2

        const cart = useCejStore.getState().cart;
        const idToRemove = cart[0].id;
        const idToKeep = cart[1].id;

        // Remove first item
        store.removeFromCart(idToRemove);

        const newCart = useCejStore.getState().cart;
        expect(newCart).toHaveLength(1);
        expect(newCart[0].id).toBe(idToKeep);
    });
});

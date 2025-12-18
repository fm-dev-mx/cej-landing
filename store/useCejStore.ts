// store/useCejStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
    DEFAULT_CALCULATOR_STATE
} from '@/types/domain';

// Import Slices
import { type CalculatorSlice, createCalculatorSlice } from './slices/calculatorSlice';
import { type CartSlice, createCartSlice } from './slices/cartSlice';
import { type UISlice, createUISlice } from './slices/uiSlice';
import { type UserSlice, createUserSlice } from './slices/userSlice';
import { type SubmissionSlice, createSubmissionSlice } from './slices/submissionSlice';
import { type OrderSlice, createOrderSlice } from './slices/ordersSlice';

export type CejStore = CalculatorSlice & CartSlice & UISlice & UserSlice & SubmissionSlice & OrderSlice;

type PersistedState = Pick<CejStore, 'cart' | 'history' | 'user' | 'draft' | 'savedDrafts' | 'submittedQuote' | 'breakdownViewed' | 'orders'>;

export const useCejStore = create<CejStore>()(
    persist(
        (set, get, api) => ({
            ...createCalculatorSlice(set, get, api),
            ...createCartSlice(set, get, api),
            ...createUISlice(set, get, api),
            ...createUserSlice(set, get, api),
            ...createSubmissionSlice(set, get, api),
            ...createOrderSlice(set, get, api),
        }),
        {
            name: 'cej-pro-storage',
            storage: createJSONStorage(() => localStorage),
            version: 5, // Bumped for OMS structural changes
            migrate: (persistedState: unknown, version) => {
                if (!persistedState || typeof persistedState !== 'object') {
                    return {
                        cart: [],
                        history: [],
                        orders: [],
                        user: {
                            visitorId: uuidv4(),
                            hasConsentedPersistence: true,
                        },
                        draft: { ...DEFAULT_CALCULATOR_STATE },
                        savedDrafts: {},
                        submittedQuote: null,
                        breakdownViewed: false,
                    } as PersistedState;
                }

                const state = persistedState as Partial<PersistedState>;

                if (!state.cart) state.cart = [];
                if (!state.history) state.history = [];
                if (!state.orders) state.orders = [];
                if (!state.user) {
                    state.user = {
                        visitorId: uuidv4(),
                        hasConsentedPersistence: true,
                    };
                }
                if (!state.draft) {
                    state.draft = { ...DEFAULT_CALCULATOR_STATE };
                }

                if (version === 0 || version === 1) {
                    // Migration v0/v1 -> v2: Add additives array
                    if (state.draft && !state.draft.additives) {
                        state.draft.additives = [];
                        state.draft.showExpertOptions = false;
                    }
                }

                if (version < 4) {
                    // Migration v2/v3 -> v4: Add progressive disclosure state
                    if (state.breakdownViewed === undefined) {
                        state.breakdownViewed = false;
                    }
                    // Ensure submittedQuote has results if it exists (or clear it)
                    if (state.submittedQuote && !state.submittedQuote.results) {
                        state.submittedQuote = null;
                    }
                }

                // Migration v4 -> v5: Structural OMS updates (orders array added)
                if (version < 5) {
                    if (!state.orders) state.orders = [];
                }

                return state as PersistedState;
            },
            partialize: (state): PersistedState => ({
                cart: state.cart,
                history: state.history,
                user: state.user,
                draft: state.draft,
                savedDrafts: state.savedDrafts,
                breakdownViewed: state.breakdownViewed,
                submittedQuote: state.submittedQuote,
                orders: state.orders,
            }),
        }
    )
);

// Expose store to window for E2E testing (Non-production, E2E mode, or localhost)
if (typeof window !== 'undefined' && (
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PUBLIC_E2E === 'true' ||
    window.location.hostname === 'localhost'
)) {
    (window as unknown as { useCejStore: unknown }).useCejStore = useCejStore;
}

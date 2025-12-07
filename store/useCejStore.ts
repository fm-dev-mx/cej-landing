// store/useCejStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
    type CalculatorState,
    type QuoteBreakdown,
    DEFAULT_CALCULATOR_STATE,
    type WorkTypeId,
    type ConcreteType,
    type Strength,
    type CalculatorMode,
    type AssistVolumeMode,
    type CofferedSize
} from '@/components/Calculator/types';
import { WORK_TYPES } from '@/config/business';

// --- Types ---

export type QuoteItem = {
    id: string;
    timestamp: number;
    inputs: CalculatorState;
    results: QuoteBreakdown;
    config: { label: string };
};

interface UserState {
    visitorId: string;
    name?: string;
    phone?: string;
    hasConsentedPersistence: boolean;
}

// --- Slices Interfaces ---

interface CalculatorSlice {
    draft: CalculatorState;
    // Actions
    resetDraft: () => void;
    updateDraft: (updates: Partial<CalculatorState>) => void;

    // Convenience Setters (Keep logic close to data)
    setMode: (mode: CalculatorMode) => void;
    setWorkType: (id: WorkTypeId | null) => void;
}

interface OrderSlice {
    cart: QuoteItem[];
    history: QuoteItem[]; // Kept for compatibility with QuoteDrawer
    addToCart: (quote: QuoteBreakdown) => void;
    removeFromCart: (id: string) => void;
    clearCart: () => void;
    loadItemAsDraft: (item: QuoteItem) => void;
}

interface UISlice {
    isDrawerOpen: boolean;
    activeTab: 'order' | 'history';
    setDrawerOpen: (isOpen: boolean) => void;
    setActiveTab: (tab: 'order' | 'history') => void;
}

interface IdentitySlice {
    user: UserState;
    updateUserContact: (contact: { name: string; phone: string; save: boolean }) => void;
}

type CejStore = CalculatorSlice & OrderSlice & UISlice & IdentitySlice;

// --- Store Implementation ---

export const useCejStore = create<CejStore>()(
    persist(
        (set, get) => ({
            // ---------------------------------------------------------
            // 1. Calculator Slice
            // ---------------------------------------------------------
            draft: { ...DEFAULT_CALCULATOR_STATE },

            resetDraft: () => set({ draft: { ...DEFAULT_CALCULATOR_STATE } }),

            updateDraft: (updates) => set((state) => ({
                draft: { ...state.draft, ...updates }
            })),

            setMode: (mode) => {
                set((state) => {
                    const nextDraft = { ...state.draft, mode };
                    // Reset irrelevant fields on mode switch for cleaner UX
                    if (mode === 'knownM3') {
                        nextDraft.workType = null;
                        nextDraft.hasCoffered = 'no';
                    } else {
                        nextDraft.m3 = '';
                    }
                    return { draft: nextDraft };
                });
            },

            setWorkType: (workType) => {
                set((state) => {
                    if (!workType) return { draft: { ...state.draft, workType: null } };

                    const config = WORK_TYPES.find(w => w.id === workType);
                    // Business Rule: Slab usually requires Pumped service
                    const recommendedType: ConcreteType = workType === 'slab' ? 'pumped' : state.draft.type;

                    return {
                        draft: {
                            ...state.draft,
                            workType,
                            strength: config ? config.recommendedStrength : state.draft.strength,
                            type: recommendedType,
                            // Auto-select coffered logic if slab, but let user change it
                            hasCoffered: workType === 'slab' ? 'yes' : 'no',
                            cofferedSize: workType === 'slab' ? '7' : null,
                        }
                    };
                });
            },

            // ---------------------------------------------------------
            // 2. Order Slice (Cart)
            // ---------------------------------------------------------
            cart: [],
            history: [],

            addToCart: (results) => {
                const state = get();
                let workTypeLabel = 'Carga Manual';
                if (state.draft.mode === 'assistM3' && state.draft.workType) {
                    const match = WORK_TYPES.find(w => w.id === state.draft.workType);
                    if (match) workTypeLabel = match.label;
                } else if (state.draft.mode === 'knownM3') {
                    workTypeLabel = 'Volumen Directo';
                }

                const label = `${workTypeLabel} - f'c ${state.draft.strength}`;

                const newItem: QuoteItem = {
                    id: uuidv4(),
                    timestamp: Date.now(),
                    inputs: { ...state.draft },
                    results,
                    config: { label }
                };

                set((s) => ({
                    cart: [...s.cart, newItem],
                    history: [newItem, ...s.history].slice(0, 50),
                    draft: { ...DEFAULT_CALCULATOR_STATE }, // Auto-reset for next item
                    isDrawerOpen: true, // Show cart feedback
                    activeTab: 'order'
                }));
            },

            removeFromCart: (id) => set((state) => ({
                cart: state.cart.filter((item) => item.id !== id)
            })),

            clearCart: () => set({ cart: [] }),

            loadItemAsDraft: (item) => {
                set({
                    draft: { ...item.inputs },
                    isDrawerOpen: false,
                });
            },

            // ---------------------------------------------------------
            // 3. UI Slice
            // ---------------------------------------------------------
            isDrawerOpen: false,
            activeTab: 'order',

            setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
            setActiveTab: (tab) => set({ activeTab: tab }),

            // ---------------------------------------------------------
            // 4. Identity Slice
            // ---------------------------------------------------------
            user: {
                visitorId: uuidv4(),
                hasConsentedPersistence: true,
            },

            updateUserContact: ({ name, phone, save }) => set((state) => ({
                user: {
                    ...state.user,
                    name: save ? name : undefined,
                    phone: save ? phone : undefined,
                    hasConsentedPersistence: save
                }
            })),
        }),
        {
            name: 'cej-pro-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                cart: state.cart,
                history: state.history,
                user: state.user,
                // We don't persist draft indefinitely to avoid stale state on return,
                // or we can persist it if we want "resume" functionality.
                // For "Phase 1 cleanup", let's persist everything for safety.
                draft: state.draft
            }),
        }
    )
);

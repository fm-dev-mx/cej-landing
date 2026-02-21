// store/useCejStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
    type CalculatorState,
    type QuoteBreakdown,
    DEFAULT_CALCULATOR_STATE
} from '@/components/Calculator/types';
import { WORK_TYPES } from '@/config/business';

export type QuoteItem = {
    id: string;
    timestamp: number;
    inputs: CalculatorState;
    results: QuoteBreakdown;
    config: { mode: 'expert' | 'wizard'; label: string };
};

interface UserState {
    visitorId: string;
    name?: string;
    phone?: string;
    hasConsentedPersistence: boolean;
}

interface CejState {
    // --- UI Configuration ---
    viewMode: 'wizard' | 'expert';
    isDrawerOpen: boolean;
    activeTab: 'order' | 'history';

    // --- Staging Area (Current Calculation) ---
    currentDraft: CalculatorState;

    // --- Persistence Data ---
    cart: QuoteItem[];
    history: QuoteItem[];

    // --- Identity (Lazy Auth) ---
    user: UserState;

    // --- Actions ---
    toggleViewMode: () => void;
    setDrawerOpen: (isOpen: boolean) => void;
    setActiveTab: (tab: 'order' | 'history') => void;

    // Draft Actions
    updateDraft: (updates: Partial<CalculatorState>) => void;
    resetDraft: () => void;
    // Feature: Clone/Repeat Order
    loadHistoryItemAsDraft: (item: QuoteItem) => void;

    // Cart Actions
    addToCart: (quote: QuoteBreakdown) => void;
    removeFromCart: (id: string) => void;
    clearCart: () => void;

    // User Actions
    updateUserContact: (contact: { name: string; phone: string; save: boolean }) => void;
}

export const useCejStore = create<CejState>()(
    persist(
        (set, get) => ({
            // Initial State
            viewMode: 'wizard',
            isDrawerOpen: false,
            activeTab: 'order',
            currentDraft: { ...DEFAULT_CALCULATOR_STATE },
            cart: [],
            history: [],
            user: {
                visitorId: uuidv4(), // Generate generic ID on init
                hasConsentedPersistence: true, // Default to true for UX, user can opt-out
            },

            // Actions
            toggleViewMode: () => set((state) => ({
                viewMode: state.viewMode === 'wizard' ? 'expert' : 'wizard'
            })),

            setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
            setActiveTab: (tab) => set({ activeTab: tab }),

            updateDraft: (updates) => set((state) => ({
                currentDraft: { ...state.currentDraft, ...updates }
            })),

            resetDraft: () => set({
                currentDraft: { ...DEFAULT_CALCULATOR_STATE }
            }),

            loadHistoryItemAsDraft: (item) => {
                set({
                    currentDraft: { ...item.inputs, step: 3 }, // Jump to inputs step to verify volumes
                    isDrawerOpen: false, // Close drawer to show calculator
                    viewMode: item.config.mode // Switch to the mode used in that quote
                });
            },

            addToCart: (results) => {
                const state = get();

                // Smart Naming: Resolve label from config or fallback
                let workTypeLabel = 'Concreto';
                if (state.currentDraft.workType) {
                    const match = WORK_TYPES.find(w => w.id === state.currentDraft.workType);
                    if (match) workTypeLabel = match.label;
                }

                const label = `${workTypeLabel} f'c ${state.currentDraft.strength}`;

                const newItem: QuoteItem = {
                    id: uuidv4(),
                    timestamp: Date.now(),
                    inputs: { ...state.currentDraft },
                    results,
                    config: {
                        mode: state.viewMode,
                        label
                    }
                };

                set((state) => ({
                    cart: [...state.cart, newItem],
                    history: [newItem, ...state.history].slice(0, 50), // Keep last 50
                    currentDraft: { ...DEFAULT_CALCULATOR_STATE },
                    isDrawerOpen: true,
                    activeTab: 'order'
                }));
            },

            removeFromCart: (id) => set((state) => ({
                cart: state.cart.filter((item) => item.id !== id)
            })),

            clearCart: () => set({ cart: [] }),

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
            // Persist everything critical.
            // We intentionally persist 'cart' and 'user' to survive browser closes.
            partialize: (state) => ({
                cart: state.cart,
                history: state.history,
                user: state.user,
                viewMode: state.viewMode
            }),
        }
    )
);

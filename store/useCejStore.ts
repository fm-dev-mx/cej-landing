// store/useCejStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
    type CalculatorState,
    type QuoteBreakdown
} from '@/components/Calculator/types';
import { DEFAULT_CALCULATOR_STATE } from '@/components/Calculator/hooks/useCalculatorState';

export type QuoteItem = {
    id: string;
    timestamp: number;
    inputs: CalculatorState;
    results: QuoteBreakdown;
    config: { mode: 'expert' | 'wizard'; label: string };
};

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
    user: {
        name?: string;
        phone?: string;
        visitorId: string;
    };

    // --- Actions ---
    toggleViewMode: () => void;
    setDrawerOpen: (isOpen: boolean) => void;
    setActiveTab: (tab: 'order' | 'history') => void;

    // Draft Actions
    updateDraft: (updates: Partial<CalculatorState>) => void;
    resetDraft: () => void;

    // Cart Actions
    addToCart: (quote: QuoteBreakdown) => void;
    removeFromCart: (id: string) => void;
    clearCart: () => void;
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

            addToCart: (results) => {
                const state = get();
                const newItem: QuoteItem = {
                    id: uuidv4(),
                    timestamp: Date.now(),
                    inputs: { ...state.currentDraft },
                    results,
                    config: {
                        mode: state.viewMode,
                        label: `Cálculo ${state.cart.length + 1}` // TODO: Use smart naming based on WorkType
                    }
                };

                set((state) => ({
                    cart: [...state.cart, newItem],
                    history: [newItem, ...state.history].slice(0, 50), // Keep last 50 in history
                    currentDraft: { ...DEFAULT_CALCULATOR_STATE }, // Reset draft after adding
                    isDrawerOpen: true, // Open drawer to show feedback
                    activeTab: 'order'
                }));
            },

            removeFromCart: (id) => set((state) => ({
                cart: state.cart.filter((item) => item.id !== id)
            })),

            clearCart: () => set({ cart: [] }),
        }),
        {
            name: 'cej-pro-storage',
            storage: createJSONStorage(() => localStorage),
            // Only persist critical data, avoid persisting transient UI state like isDrawerOpen if undesired
            partialize: (state) => ({
                cart: state.cart,
                history: state.history,
                user: state.user,
                viewMode: state.viewMode
            }),
        }
    )
);

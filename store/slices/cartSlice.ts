import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
    type CartItem,
    type QuoteBreakdown,
    type CustomerInfo,
    DEFAULT_CALCULATOR_STATE,
} from '@/types/domain';
import { WORK_TYPES } from '@/config/business';
import { CalculatorSlice } from './calculatorSlice';

export interface CartSlice {
    cart: CartItem[];
    history: CartItem[];
    addToCart: (results: QuoteBreakdown, openDrawer?: boolean) => string;
    updateCartItem: (id: string, results: QuoteBreakdown) => void;
    updateCartItemCustomer: (id: string, customer: CustomerInfo) => void;
    updateCartItemFolio: (id: string, folio: string) => void;
    removeFromCart: (id: string) => void;
    editCartItem: (id: string) => void;
    cancelEdit: () => void;
    cloneCartItem: (item: CartItem) => void;
    clearCart: () => void;
    moveToHistory: () => void;
    loadQuote: (item: CartItem) => void;
}

// Composition type for cross-slice access if needed (though we avoid it if possible)
type CombinedState = CartSlice & CalculatorSlice & { editingItemId: string | null; setDrawerOpen: (open: boolean) => void; setActiveTab: (tab: 'order' | 'history') => void };

export const createCartSlice: StateCreator<CombinedState, [], [], CartSlice> = (set, get) => ({
    cart: [],
    history: [],

    addToCart: (results, openDrawer = true) => {
        const state = get();
        const draft = state.draft;

        if (state.editingItemId) {
            const existingItem = state.cart.find(i => i.id === state.editingItemId);
            if (existingItem) {
                let workTypeLabel = 'Carga Manual';
                if (draft.mode === 'assistM3' && draft.workType) {
                    const match = WORK_TYPES.find(w => w.id === draft.workType);
                    if (match) workTypeLabel = match.label;
                } else if (draft.mode === 'knownM3') {
                    workTypeLabel = 'Volumen Directo';
                }
                const additivesList = draft.additives || [];
                const additivesCount = additivesList.length;
                const label = `${workTypeLabel} - f'c ${draft.strength} ${additivesCount > 0 ? `(+${additivesCount})` : ''}`;

                const updatedItem: CartItem = {
                    ...existingItem,
                    timestamp: Date.now(),
                    inputs: { ...draft, additives: additivesList },
                    results, // Snapshot Pattern: new results are passed in
                    config: { label }
                };

                set({
                    cart: state.cart.map(item => item.id === state.editingItemId ? updatedItem : item),
                    draft: { ...DEFAULT_CALCULATOR_STATE },
                    editingItemId: null,
                });
                state.setDrawerOpen(openDrawer);
                state.setActiveTab('order');

                return state.editingItemId;
            }
        }

        let workTypeLabel = 'Carga Manual';
        if (draft.mode === 'assistM3' && draft.workType) {
            const match = WORK_TYPES.find(w => w.id === draft.workType);
            if (match) workTypeLabel = match.label;
        } else if (draft.mode === 'knownM3') {
            workTypeLabel = 'Volumen Directo';
        }

        const additivesList = draft.additives || [];
        const additivesCount = additivesList.length;
        const label = `${workTypeLabel} - f'c ${draft.strength} ${additivesCount > 0 ? `(+${additivesCount})` : ''}`;

        const id = uuidv4();
        const newItem: CartItem = {
            id,
            timestamp: Date.now(),
            inputs: { ...draft, additives: additivesList },
            results, // Snapshot Pattern: results contains prices at this moment
            config: { label }
        };

        set((s) => ({
            cart: [...s.cart, newItem],
            draft: { ...DEFAULT_CALCULATOR_STATE },
            editingItemId: null,
        }));
        state.setDrawerOpen(openDrawer);
        state.setActiveTab('order');

        return id;
    },

    updateCartItem: (id, results) => {
        const state = get();
        const draft = state.draft;
        const existingItem = state.cart.find(i => i.id === id);
        if (!existingItem) return;

        let workTypeLabel = 'Carga Manual';
        if (draft.mode === 'assistM3' && draft.workType) {
            const match = WORK_TYPES.find(w => w.id === draft.workType);
            if (match) workTypeLabel = match.label;
        } else if (draft.mode === 'knownM3') {
            workTypeLabel = 'Volumen Directo';
        }
        const additivesList = draft.additives || [];
        const additivesCount = additivesList.length;
        const label = `${workTypeLabel} - f'c ${draft.strength} ${additivesCount > 0 ? `(+${additivesCount})` : ''}`;

        const updatedItem: CartItem = {
            ...existingItem,
            timestamp: Date.now(),
            inputs: { ...draft, additives: additivesList },
            results,
            config: { label }
        };

        set({
            cart: state.cart.map(item => item.id === id ? updatedItem : item),
            draft: { ...DEFAULT_CALCULATOR_STATE },
            editingItemId: null,
        });
    },

    updateCartItemCustomer: (id, customer) => {
        set((state) => ({
            cart: state.cart.map(item =>
                item.id === id ? { ...item, customer } : item
            )
        }));
    },

    updateCartItemFolio: (id, folio) => {
        set((state) => ({
            cart: state.cart.map(item =>
                item.id === id ? { ...item, folio } : item
            )
        }));
    },

    removeFromCart: (id) => set((state) => ({
        cart: state.cart.filter((item) => item.id !== id)
    })),

    editCartItem: (id) => {
        const state = get();
        const item = state.cart.find((i) => i.id === id);

        if (item && item.inputs) {
            set({
                draft: { ...item.inputs },
                editingItemId: id,
            });
            state.setDrawerOpen(false);
            if (typeof document !== 'undefined') {
                const el = document.getElementById('calculator-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
        }
    },

    cancelEdit: () => {
        set({
            draft: { ...DEFAULT_CALCULATOR_STATE },
            editingItemId: null,
        });
    },

    cloneCartItem: (item) => {
        if (item.inputs) {
            set({
                draft: { ...item.inputs },
            });
            get().setDrawerOpen(false);
            if (typeof document !== 'undefined') {
                const el = document.getElementById('calculator-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }
        }
    },

    clearCart: () => set({ cart: [] }),

    moveToHistory: () => set((state) => ({
        history: [...state.cart, ...state.history].slice(0, 50),
        cart: []
    })),

    loadQuote: (item) => {
        set({
            draft: { ...item.inputs },
        });
        const state = get();
        state.setActiveTab('order');
        state.setDrawerOpen(false);
        if (typeof document !== 'undefined') {
            document.getElementById('calculator-section')?.scrollIntoView({ behavior: 'smooth' });
        }
    },
});

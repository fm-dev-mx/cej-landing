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
    type CalculatorMode,
    type CartItem,
} from '@/types/domain';
import { WORK_TYPES } from '@/config/business';

// --- Types ---

interface UserState {
    visitorId: string;
    name?: string;
    phone?: string;
    hasConsentedPersistence: boolean;
}

// --- Slices Interfaces ---

interface CalculatorSlice {
    draft: CalculatorState;
    resetDraft: () => void;
    updateDraft: (updates: Partial<CalculatorState>) => void;
    setMode: (mode: CalculatorMode) => void;
    setWorkType: (id: WorkTypeId | null) => void;
    // Phase 2 Actions
    toggleAdditive: (id: string) => void;
    setExpertMode: (isActive: boolean) => void;
}

interface OrderSlice {
    cart: CartItem[];
    history: CartItem[];
    addToCart: (quote: QuoteBreakdown) => void;
    removeFromCart: (id: string) => void;
    editCartItem: (id: string) => void;
    cloneCartItem: (item: CartItem) => void;
    clearCart: () => void;
    moveToHistory: () => void;
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

type PersistedState = Pick<CejStore, 'cart' | 'history' | 'user' | 'draft'>;

// --- Store Implementation ---

export const useCejStore = create<CejStore>()(
    persist(
        (set, get) => ({
            // --- Calculator Slice ---
            draft: { ...DEFAULT_CALCULATOR_STATE },

            resetDraft: () => set({ draft: { ...DEFAULT_CALCULATOR_STATE } }),

            updateDraft: (updates) => set((state) => ({
                draft: { ...state.draft, ...updates }
            })),

            setMode: (mode) => {
                set((state) => {
                    const nextDraft = { ...state.draft, mode };
                    // Reset fields relevant to the new mode
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
                    const recommendedType: ConcreteType = workType === 'slab' ? 'pumped' : state.draft.type;

                    return {
                        draft: {
                            ...state.draft,
                            workType,
                            strength: config ? config.recommendedStrength : state.draft.strength,
                            type: recommendedType,
                            hasCoffered: workType === 'slab' ? 'yes' : 'no',
                            cofferedSize: workType === 'slab' ? '7' : null,
                        }
                    };
                });
            },

            // Safe Additive Toggle
            toggleAdditive: (id) => {
                set((state) => {
                    // Safety: Ensure array exists
                    const current = state.draft.additives || [];
                    const exists = current.includes(id);
                    const next = exists
                        ? current.filter(a => a !== id)
                        : [...current, id];
                    return { draft: { ...state.draft, additives: next } };
                });
            },

            // Safe Expert Mode
            setExpertMode: (isActive) => {
                set((state) => ({
                    draft: {
                        ...state.draft,
                        showExpertOptions: isActive,
                        // Clear additives if disabling expert mode
                        additives: isActive ? (state.draft.additives || []) : []
                    }
                }));
            },

            // --- Order Slice ---
            cart: [],
            history: [],

            addToCart: (results) => {
                const state = get();

                // Construct label
                let workTypeLabel = 'Carga Manual';
                if (state.draft.mode === 'assistM3' && state.draft.workType) {
                    const match = WORK_TYPES.find(w => w.id === state.draft.workType);
                    if (match) workTypeLabel = match.label;
                } else if (state.draft.mode === 'knownM3') {
                    workTypeLabel = 'Volumen Directo';
                }

                const additivesList = state.draft.additives || [];
                const additivesCount = additivesList.length;

                const label = `${workTypeLabel} - f'c ${state.draft.strength} ${additivesCount > 0 ? `(+${additivesCount})` : ''}`;

                // Create strict CartItem
                const newItem: CartItem = {
                    id: uuidv4(),
                    timestamp: Date.now(),
                    inputs: { ...state.draft, additives: additivesList },
                    results,
                    config: { label }
                };

                set((s) => ({
                    cart: [...s.cart, newItem],
                    draft: { ...DEFAULT_CALCULATOR_STATE }, // Reset Form
                    isDrawerOpen: true,
                    activeTab: 'order'
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
                        cart: state.cart.filter((i) => i.id !== id),
                        isDrawerOpen: false,
                    });
                    if (typeof document !== 'undefined') {
                        document.getElementById('calculator-section')?.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            },

            cloneCartItem: (item) => {
                if (item.inputs) {
                    set({
                        draft: { ...item.inputs },
                        isDrawerOpen: false,
                    });
                    if (typeof document !== 'undefined') {
                        document.getElementById('calculator-section')?.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            },

            clearCart: () => set({ cart: [] }),

            moveToHistory: () => set((state) => ({
                history: [...state.cart, ...state.history].slice(0, 50),
                cart: []
            })),

            // --- UI Slice ---
            isDrawerOpen: false,
            activeTab: 'order',
            setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
            setActiveTab: (tab) => set({ activeTab: tab }),

            // --- Identity Slice ---
            user: {
                visitorId: uuidv4(),
                hasConsentedPersistence: true,
            },
            updateUserContact: ({ name, phone, save }) => set((state) => ({
                user: {
                    ...state.user,
                    name: save ? name : state.user.name,
                    phone: save ? phone : state.user.phone,
                    hasConsentedPersistence: save
                }
            })),
        }),
        {
            name: 'cej-pro-storage',
            storage: createJSONStorage(() => localStorage),
            version: 2,
            migrate: (persistedState: unknown, version) => {
                const state = persistedState as CejStore;
                if (version === 0 || version === 1) {
                    // Migración Fase 1 -> Fase 2
                    if (state.draft && !state.draft.additives) {
                        state.draft.additives = [];
                        state.draft.showExpertOptions = false;
                    }
                }
                return state;
            },
            partialize: (state): PersistedState => ({
                cart: state.cart,
                history: state.history,
                user: state.user,
                draft: state.draft
            }),
        }
    )
);

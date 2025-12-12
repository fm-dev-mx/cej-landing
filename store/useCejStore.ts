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
    type CustomerInfo,
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
    addToCart: (quote: QuoteBreakdown) => string; // Returns the new item ID
    updateCartItemCustomer: (id: string, customer: CustomerInfo) => void;
    removeFromCart: (id: string) => void;
    editCartItem: (id: string) => void;
    cloneCartItem: (item: CartItem) => void;
    clearCart: () => void;
    moveToHistory: () => void;
    loadQuote: (item: CartItem) => void;
}

interface UISlice {
    isDrawerOpen: boolean;
    activeTab: 'order' | 'history';
    isProcessingOrder: boolean;
    setDrawerOpen: (isOpen: boolean) => void;
    setActiveTab: (tab: 'order' | 'history') => void;
    setProcessingOrder: (isProcessing: boolean) => void;
}

interface IdentitySlice {
    user: UserState;
    updateUserContact: (contact: { name: string; phone: string; save: boolean }) => void;
}

// Phase 0 Bugfix: Global submission state to avoid losing data between renders
// Phase 1: Added breakdownViewed for progressive disclosure
interface SubmissionSlice {
    breakdownViewed: boolean;
    submittedQuote: { folio: string; name: string; results: QuoteBreakdown } | null;
    setBreakdownViewed: (viewed: boolean) => void;
    setSubmittedQuote: (data: { folio: string; name: string; results: QuoteBreakdown } | null) => void;
    clearSubmittedQuote: () => void;
}

type CejStore = CalculatorSlice & OrderSlice & UISlice & IdentitySlice & SubmissionSlice;

type PersistedState = Pick<CejStore, 'cart' | 'history' | 'user' | 'draft' | 'submittedQuote' | 'breakdownViewed'>;

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
                const id = uuidv4();
                const newItem: CartItem = {
                    id,
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

                return id;
            },

            updateCartItemCustomer: (id, customer) => {
                set((state) => ({
                    cart: state.cart.map(item =>
                        item.id === id ? { ...item, customer } : item
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

            /**
             * Restores a quote from history into the draft.
             * Closes the drawer and switches to order tab so user can edit and resubmit.
             * Note: Does NOT add to cart automatically - user must review and request quote again.
             */
            loadQuote: (item) => {
                set((state) => ({
                    draft: { ...item.inputs },
                    // Reset to order view so next time they open drawer they see cart
                    activeTab: 'order',
                    isDrawerOpen: false
                }));
                // Scroll to calculator for better UX (like cloneCartItem)
                if (typeof document !== 'undefined') {
                    document.getElementById('calculator-section')?.scrollIntoView({ behavior: 'smooth' });
                }
            },

            // --- UI Slice ---
            isDrawerOpen: false,
            activeTab: 'order',
            isProcessingOrder: false,
            setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),
            setActiveTab: (tab) => set({ activeTab: tab }),
            setProcessingOrder: (isProcessing) => set({ isProcessingOrder: isProcessing }),

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

            // --- Submission Slice (Phase 0 Bugfix + Phase 1 Progressive Disclosure) ---
            breakdownViewed: false,
            submittedQuote: null,
            setBreakdownViewed: (viewed) => set({ breakdownViewed: viewed }),
            setSubmittedQuote: (data) => set({ submittedQuote: data }),
            clearSubmittedQuote: () => set({ submittedQuote: null, breakdownViewed: false }),
        }),
        {
            name: 'cej-pro-storage',
            storage: createJSONStorage(() => localStorage),
            version: 4,
            migrate: (persistedState: unknown, version) => {
                // Defensive: validate state has expected shape before casting
                if (!persistedState || typeof persistedState !== 'object') {
                    // Corrupted or missing data: reset to safe defaults
                    return {
                        cart: [],
                        history: [],
                        user: {
                            visitorId: uuidv4(),
                            hasConsentedPersistence: true,
                        },
                        draft: { ...DEFAULT_CALCULATOR_STATE },
                        submittedQuote: null,
                        breakdownViewed: false,
                    } as PersistedState;
                }

                const state = persistedState as Partial<PersistedState>;

                // Safe initialization of potentially missing properties
                if (!state.cart) state.cart = [];
                if (!state.history) state.history = [];
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

                return state as PersistedState;
            },
            partialize: (state): PersistedState => ({
                cart: state.cart,
                history: state.history,
                user: state.user,
                draft: state.draft,
                breakdownViewed: state.breakdownViewed,
                submittedQuote: state.submittedQuote,
            }),
        }
    )
);

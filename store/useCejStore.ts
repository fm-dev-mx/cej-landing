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
    type CofferedSize,
    type Step
} from '@/components/Calculator/types';
import { WORK_TYPES } from '@/config/business';

// --- Types ---

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

// --- Slices Interfaces ---

interface CalculatorSlice {
    draft: CalculatorState;
    // Actions
    resetDraft: () => void;
    setStep: (step: Step) => void;
    setMode: (mode: CalculatorMode | null) => void;
    setWorkType: (id: WorkTypeId | null) => void;
    updateDraft: (updates: Partial<CalculatorState>) => void;
    // Specific Setters (Stabilized for Context)
    setVolumeMode: (mode: AssistVolumeMode) => void;
    setStrength: (strength: Strength) => void;
    setType: (type: ConcreteType) => void;
    setM3: (m3: string) => void;
    setLength: (length: string) => void;
    setWidth: (width: string) => void;
    setArea: (area: string) => void;
    setThicknessByDims: (val: string) => void;
    setThicknessByArea: (val: string) => void;
    setHasCoffered: (val: 'yes' | 'no') => void;
    setCofferedSize: (val: CofferedSize) => void;
}

interface OrderSlice {
    cart: QuoteItem[];
    history: QuoteItem[];
    addToCart: (quote: QuoteBreakdown, currentViewMode: 'expert' | 'wizard') => void;
    removeFromCart: (id: string) => void;
    clearCart: () => void;
    loadItemAsDraft: (item: QuoteItem) => void;
}

interface UISlice {
    viewMode: 'wizard' | 'expert';
    isDrawerOpen: boolean;
    activeTab: 'order' | 'history';
    toggleViewMode: () => void;
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

            setStep: (step) => set((state) => ({
                draft: { ...state.draft, step }
            })),

            setMode: (mode) => {
                set((state) => {
                    const nextDraft = { ...state.draft, mode };
                    // Reset logic based on mode
                    if (mode === 'knownM3') {
                        nextDraft.length = '';
                        nextDraft.width = '';
                        nextDraft.area = '';
                        nextDraft.workType = null;
                        nextDraft.hasCoffered = 'no';
                        nextDraft.cofferedSize = null;
                        nextDraft.step = 3;
                    } else {
                        nextDraft.m3 = '';
                        nextDraft.step = 2; // Go to WorkType selector
                    }
                    return { draft: nextDraft };
                });
            },

            setWorkType: (workType) => {
                set((state) => {
                    if (!workType) return { draft: { ...state.draft, workType: null, strength: '200' } };

                    const config = WORK_TYPES.find(w => w.id === workType);

                    // Business Rule: Slab usually requires Pumped service
                    const recommendedType: ConcreteType = workType === 'slab' ? 'pumped' : state.draft.type;

                    return {
                        draft: {
                            ...state.draft,
                            workType,
                            strength: config ? config.recommendedStrength : state.draft.strength,
                            type: recommendedType,
                            hasCoffered: workType === 'slab' ? 'yes' : 'no',
                            cofferedSize: workType === 'slab' ? '7' : null,
                            step: 3
                        }
                    };
                });
            },

            setVolumeMode: (volumeMode) => set((s) => ({ draft: { ...s.draft, volumeMode } })),
            setStrength: (strength) => set((s) => ({ draft: { ...s.draft, strength } })),
            setType: (type) => set((s) => ({ draft: { ...s.draft, type } })),

            // Granular setters implementation
            setM3: (m3) => set((s) => ({ draft: { ...s.draft, m3 } })),
            setLength: (length) => set((s) => ({ draft: { ...s.draft, length } })),
            setWidth: (width) => set((s) => ({ draft: { ...s.draft, width } })),
            setArea: (area) => set((s) => ({ draft: { ...s.draft, area } })),
            setThicknessByDims: (thicknessByDims) => set((s) => ({ draft: { ...s.draft, thicknessByDims } })),
            setThicknessByArea: (thicknessByArea) => set((s) => ({ draft: { ...s.draft, thicknessByArea } })),

            setHasCoffered: (hasCoffered) => set((s) => ({
                draft: {
                    ...s.draft,
                    hasCoffered,
                    cofferedSize: hasCoffered === 'yes' ? '7' : null
                }
            })),

            setCofferedSize: (cofferedSize) => set((s) => ({ draft: { ...s.draft, cofferedSize } })),

            // ---------------------------------------------------------
            // 2. Order Slice (Cart)
            // ---------------------------------------------------------
            cart: [],
            history: [],

            addToCart: (results, currentViewMode) => {
                const state = get();

                let workTypeLabel = 'Concreto';
                if (state.draft.workType) {
                    const match = WORK_TYPES.find(w => w.id === state.draft.workType);
                    if (match) workTypeLabel = match.label;
                }
                const label = `${workTypeLabel} f'c ${state.draft.strength}`;

                const newItem: QuoteItem = {
                    id: uuidv4(),
                    timestamp: Date.now(),
                    inputs: { ...state.draft },
                    results,
                    config: {
                        mode: currentViewMode,
                        label
                    }
                };

                set((s) => ({
                    cart: [...s.cart, newItem],
                    history: [newItem, ...s.history].slice(0, 50),
                    draft: { ...DEFAULT_CALCULATOR_STATE },
                    isDrawerOpen: true,
                    activeTab: 'order'
                }));
            },

            removeFromCart: (id) => set((state) => ({
                cart: state.cart.filter((item) => item.id !== id)
            })),

            clearCart: () => set({ cart: [] }),

            loadItemAsDraft: (item) => {
                set({
                    draft: { ...item.inputs, step: 3 },
                    isDrawerOpen: false,
                    viewMode: item.config.mode
                });
            },

            // ---------------------------------------------------------
            // 3. UI Slice
            // ---------------------------------------------------------
            viewMode: 'wizard',
            isDrawerOpen: false,
            activeTab: 'order',

            toggleViewMode: () => set((state) => ({
                viewMode: state.viewMode === 'wizard' ? 'expert' : 'wizard'
            })),

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
                viewMode: state.viewMode
            }),
        }
    )
);

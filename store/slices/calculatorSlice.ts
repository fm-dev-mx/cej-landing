import { StateCreator } from 'zustand';
import { UISlice } from './uiSlice';
import {
    type CalculatorState,
    type CalculatorMode,
    type WorkTypeId,
    type ConcreteType,
    DEFAULT_CALCULATOR_STATE,
} from '@/types/domain';
import { WORK_TYPES } from '@/config/business';

export interface CalculatorSlice {
    draft: CalculatorState;
    savedDrafts: Partial<Record<CalculatorMode, CalculatorState>>;
    resetDraft: () => void;
    updateDraft: (updates: Partial<CalculatorState>) => void;
    setMode: (mode: CalculatorMode) => void;
    setWorkType: (id: WorkTypeId | null) => void;
    toggleAdditive: (id: string) => void;
    setExpertMode: (isActive: boolean) => void;
}

export const createCalculatorSlice: StateCreator<CalculatorSlice & UISlice, [], [], CalculatorSlice> = (set) => ({
    draft: { ...DEFAULT_CALCULATOR_STATE },
    savedDrafts: {},

    resetDraft: () => set({
        draft: { ...DEFAULT_CALCULATOR_STATE },
        savedDrafts: {},
        editingItemId: null
    }),

    updateDraft: (updates) => set((state) => ({
        draft: { ...state.draft, ...updates }
    })),

    setMode: (mode) => {
        set((state) => {
            const currentMode = state.draft.mode;
            const updatedSavedDrafts = {
                ...state.savedDrafts,
                [currentMode]: { ...state.draft }
            };

            const savedState = updatedSavedDrafts[mode];
            if (savedState) {
                return {
                    draft: { ...savedState, mode },
                    savedDrafts: updatedSavedDrafts
                };
            }

            const nextDraft = { ...DEFAULT_CALCULATOR_STATE, mode };
            if (mode === 'knownM3') {
                nextDraft.workType = null;
                nextDraft.hasCoffered = 'no';
            }

            return {
                draft: nextDraft,
                savedDrafts: updatedSavedDrafts
            };
        });
    },

    setWorkType: (workType) => {
        set((state) => {
            if (!workType) return { draft: { ...state.draft, workType: null } };
            const config = WORK_TYPES.find(w => w.id === workType);
            const recommendedType: ConcreteType | null = workType === 'slab' ? 'pumped' : state.draft.type;
            const defaultThickness = workType === 'slab' ? '5' : '10';

            return {
                draft: {
                    ...state.draft,
                    workType,
                    strength: config ? config.recommendedStrength : state.draft.strength,
                    type: recommendedType,
                    hasCoffered: workType === 'slab' ? 'yes' : 'no',
                    cofferedSize: workType === 'slab' ? '7' : null,
                    thicknessByDims: defaultThickness,
                    thicknessByArea: defaultThickness,
                }
            };
        });
    },

    toggleAdditive: (id) => {
        set((state) => {
            const current = state.draft.additives || [];
            const exists = current.includes(id);
            const next = exists
                ? current.filter(a => a !== id)
                : [...current, id];
            return { draft: { ...state.draft, additives: next } };
        });
    },

    setExpertMode: (isActive) => {
        set((state) => ({
            draft: {
                ...state.draft,
                showExpertOptions: isActive,
                additives: isActive ? (state.draft.additives || []) : []
            }
        }));
    },
});

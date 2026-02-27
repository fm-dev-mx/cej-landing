import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

import { DEFAULT_CALCULATOR_STATE } from "@/types/domain";
import {
    createCalculatorSlice,
    type CalculatorSlice,
} from "@/store/slices/calculatorSlice";
import { createCartSlice, type CartSlice } from "@/store/slices/cartSlice";
import { createUISlice, type UISlice } from "@/store/slices/uiSlice";
import { createUserSlice, type UserSlice } from "@/store/slices/userSlice";
import {
    createSubmissionSlice,
    type SubmissionSlice,
} from "@/store/slices/submissionSlice";

export type PublicStore = CalculatorSlice &
    CartSlice &
    UISlice &
    UserSlice &
    SubmissionSlice;

type PersistedState = Pick<
    PublicStore,
    | "cart"
    | "history"
    | "user"
    | "draft"
    | "savedDrafts"
    | "submittedQuote"
    | "breakdownViewed"
>;

export const usePublicStore = create<PublicStore>()(
    persist(
        (set, get, api) => ({
            ...createCalculatorSlice(set, get, api),
            ...createCartSlice(set, get, api),
            ...createUISlice(set, get, api),
            ...createUserSlice(set, get, api),
            ...createSubmissionSlice(set, get, api),
        }),
        {
            name: "cej-pro-storage",
            storage: createJSONStorage(() => localStorage),
            version: 6,
            migrate: (persistedState: unknown, version) => {
                if (!persistedState || typeof persistedState !== "object") {
                    return {
                        cart: [],
                        history: [],
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

                const state = persistedState as Partial<PersistedState> & {
                    orders?: unknown;
                };

                if (!state.cart) state.cart = [];
                if (!state.history) state.history = [];
                if (!state.user) {
                    state.user = {
                        visitorId: uuidv4(),
                        hasConsentedPersistence: true,
                    };
                }
                if (!state.draft) state.draft = { ...DEFAULT_CALCULATOR_STATE };

                if (version === 0 || version === 1) {
                    if (state.draft && !state.draft.additives) {
                        state.draft.additives = [];
                        state.draft.showExpertOptions = false;
                    }
                }

                if (version < 4) {
                    if (state.breakdownViewed === undefined) {
                        state.breakdownViewed = false;
                    }
                    if (state.submittedQuote && !state.submittedQuote.results) {
                        state.submittedQuote = null;
                    }
                }

                // v6 migration: remove legacy admin state from public storage.
                delete state.orders;

                return state as PersistedState;
            },
            partialize: (state): PersistedState => ({
                cart: state.cart,
                history: state.history,
                user: state.user,
                draft: state.draft,
                savedDrafts: state.savedDrafts,
                submittedQuote: state.submittedQuote,
                breakdownViewed: state.breakdownViewed,
            }),
        },
    ),
);

if (
    typeof window !== "undefined" &&
    (process.env.NODE_ENV !== "production" ||
        process.env.NEXT_PUBLIC_E2E === "true" ||
        window.location.hostname === "localhost")
) {
    (window as unknown as { usePublicStore: unknown }).usePublicStore =
        usePublicStore;
}

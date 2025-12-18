import { StateCreator } from 'zustand';
import { type QuoteBreakdown } from '@/types/domain';

export interface SubmissionSlice {
    breakdownViewed: boolean;
    submittedQuote: { folio: string; name: string; results: QuoteBreakdown } | null;
    setBreakdownViewed: (viewed: boolean) => void;
    setSubmittedQuote: (data: { folio: string; name: string; results: QuoteBreakdown } | null) => void;
    clearSubmittedQuote: () => void;
}

export const createSubmissionSlice: StateCreator<SubmissionSlice, [], [], SubmissionSlice> = (set) => ({
    breakdownViewed: false,
    submittedQuote: null,
    setBreakdownViewed: (viewed) => set({ breakdownViewed: viewed }),
    setSubmittedQuote: (data) => set({ submittedQuote: data }),
    clearSubmittedQuote: () => set({ submittedQuote: null, breakdownViewed: false }),
});

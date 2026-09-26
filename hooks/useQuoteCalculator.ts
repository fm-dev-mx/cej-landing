import { useCejStore } from '@/store/useCejStore';
import { useCalculatorQuote } from '@/components/Calculator/hooks/useCalculatorQuote';
import type { CalculatorState } from '@/components/Calculator/types';

export function useQuoteCalculator(form: 'wizard' | 'expert' = 'wizard') {
    const draft = useCejStore((s) => s.currentDraft);
    // ExpertForm exposes only solid-slab dimensions. Hidden wizard inputs must
    // not override the measurements currently visible to the user.
    const inputs: CalculatorState = form === 'expert' ? {
        ...draft,
        mode: 'assistM3',
        volumeMode: 'dimensions',
        hasCoffered: 'no',
        cofferedSize: null,
    } : draft;
    const result = useCalculatorQuote(inputs);

    return {
        inputs,
        rawVolume: result.requestedM3,
        quote: result.quote,
        isValid: result.canProceedToSummary,
        volumeError: result.volumeError,
    };
}

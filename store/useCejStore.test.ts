import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CALCULATOR_STATE, type CalculatorState } from '@/components/Calculator/types';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';
import { calcQuote } from '@/lib/pricing';
import { useCejStore, type QuoteItem } from './useCejStore';

describe('quote snapshots and price updates', () => {
    beforeEach(() => {
        localStorage.clear();
        useCejStore.setState({
            currentDraft: { ...DEFAULT_CALCULATOR_STATE },
            cart: [],
            history: [],
            viewMode: 'wizard',
            isDrawerOpen: false,
            activeTab: 'order',
            user: { visitorId: 'test-id', hasConsentedPersistence: true },
        });
    });

    it('rehydrates a saved fiber quote and keeps its VAT-inclusive total and separate fiber amount', async () => {
        useCejStore.getState().updateDraft({ mode: 'knownM3', m3: '2', hasFiber: true });
        useCejStore.getState().addToCart(calcQuote(2, '200', 'direct', undefined, { hasFiber: true }));

        const savedItem = useCejStore.getState().cart[0];
        const persisted = localStorage.getItem('cej-pro-storage');
        expect(persisted).not.toBeNull();
        expect(JSON.parse(persisted!).state.cart[0].results).toMatchObject({
            unitPricePerM3: 3129.63,
            fiberSubtotal: 240.74,
            subtotal: 6500,
            vat: 520,
            total: 7020,
        });

        // Clear in-memory state, then restore the saved storage envelope before hydration.
        useCejStore.setState({ cart: [], history: [] });
        localStorage.setItem('cej-pro-storage', persisted!);
        await useCejStore.persist.rehydrate();

        expect(useCejStore.getState().cart).toEqual([savedItem]);
        expect(useCejStore.getState().history).toEqual([savedItem]);
        expect(useCejStore.getState().currentDraft).toEqual(DEFAULT_CALCULATOR_STATE);
    });

    it('re-quotes legacy history using current prices while preserving its original stored results', async () => {
        const legacyInputs = {
            ...DEFAULT_CALCULATOR_STATE,
            mode: 'knownM3' as const,
            m3: '5',
        };
        delete (legacyInputs as { hasFiber?: boolean }).hasFiber;
        const legacyItem = {
            id: 'old-quote',
            timestamp: 0,
            inputs: legacyInputs,
            results: {
                volume: { requestedM3: 5, roundedM3: 5, minM3ForType: 2, billedM3: 5, isBelowMinimum: false },
                strength: '200',
                concreteType: 'direct',
                unitPricePerM3: 2500,
                subtotal: 12500,
                vat: 1000,
                total: 13500,
            },
            config: { mode: 'wizard', label: 'Concreto anterior' },
        };
        localStorage.setItem('cej-pro-storage', JSON.stringify({
            state: { history: [legacyItem], cart: [], viewMode: 'wizard' },
            version: 0,
        }));
        await useCejStore.persist.rehydrate();

        const savedItem = useCejStore.getState().history[0] as QuoteItem;
        useCejStore.getState().loadHistoryItemAsDraft(savedItem);
        const { result } = renderHook(() => useQuoteCalculator());

        expect(useCejStore.getState().currentDraft.hasFiber).toBe(false);
        expect(result.current.quote.hasFiber).toBe(false);
        expect(result.current.quote.total).toBe(14650);
        expect(useCejStore.getState().history[0]).toEqual(legacyItem);
        expect(useCejStore.getState().history[0].results.total).toBe(13500);
    });

    it('saves product and work labels from the calculated inputs rather than a different current draft', () => {
        useCejStore.getState().updateDraft({ mode: 'knownM3', m3: '99', strength: '200', workType: 'slab' });
        const inputs: CalculatorState = {
            ...DEFAULT_CALCULATOR_STATE,
            mode: 'knownM3',
            m3: '1',
            strength: 'MR 42.5',
            workType: 'walls',
        };
        useCejStore.getState().addToCart(calcQuote(1, 'MR 42.5', 'direct'), inputs);

        const savedItem = useCejStore.getState().cart[0];
        expect(savedItem.inputs).toEqual(inputs);
        expect(savedItem.config.label).toBe('Muros / industrial pesado · MR 42.5');
        expect(savedItem.results.total).toBe(3397);
    });
});

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CALCULATOR_STATE, type CalculatorState } from '@/components/Calculator/types';
import { useCejStore } from '@/store/useCejStore';
import { useQuoteCalculator } from './useQuoteCalculator';

const setDraft = (updates: Partial<CalculatorState>) => {
    useCejStore.setState({
        currentDraft: { ...DEFAULT_CALCULATOR_STATE, hasCoffered: 'no', cofferedSize: null, ...updates },
    });
};

describe('useQuoteCalculator runtime calculation', () => {
    beforeEach(() => {
        setDraft({});
    });

    it.each<Partial<CalculatorState>>([
        { mode: 'knownM3', m3: '5' },
        { mode: 'assistM3', volumeMode: 'dimensions', length: '10', width: '5', thicknessByDims: '10' },
        { mode: 'assistM3', volumeMode: 'area', area: '50', thicknessByArea: '10' },
    ])('quotes the same valid volume through each wizard input path: %j', (draft) => {
        setDraft(draft);
        const { result } = renderHook(() => useQuoteCalculator());

        expect(result.current.isValid).toBe(true);
        expect(result.current.rawVolume).toBe(draft.mode === 'knownM3' ? 5 : 4.9);
        expect(result.current.quote.total).toBe(14650);
        expect(result.current.quote.calculationDetails?.formula).toBeTruthy();
    });

    it.each(['', '0', '-1', '501', 'Infinity', '5invalid'])('rejects invalid known volume %j before quoting', (m3) => {
        setDraft({ mode: 'knownM3', m3 });
        const { result } = renderHook(() => useQuoteCalculator());

        expect(result.current.isValid).toBe(false);
        expect(result.current.quote.total).toBe(0);
    });

    it.each([
        ['dimensions', '10', '50.00 m² × 0.1 m × 0.98', 4.9],
        ['area', '10', '50.00 m² × 0.1 m × 0.98', 4.9],
        ['dimensions', '1.5', '50.00 m² × 0.015 m × 0.98', 0.735],
        ['area', '1.5', '50.00 m² × 0.015 m × 0.98', 0.735],
    ] as const)('shows the actual solid-slab formula for %s at %s cm', (volumeMode, thickness, formula, requestedM3) => {
        setDraft({
            mode: 'assistM3', volumeMode,
            length: '10', width: '5', area: '50',
            thicknessByDims: thickness, thicknessByArea: thickness,
        });
        const { result } = renderHook(() => useQuoteCalculator());

        expect(result.current.quote.calculationDetails?.formula).toBe(formula);
        expect(result.current.rawVolume).toBeCloseTo(requestedM3);
    });

    it.each<Partial<CalculatorState>>([
        { length: '-10', width: '-5' },
        { length: '1001' },
        { width: '0.01' },
        { thicknessByDims: '0.5' },
        { thicknessByDims: '201' },
        { volumeMode: 'area', area: '20001', thicknessByArea: '10' },
    ])('rejects invalid measurements before quoting: %j', (invalid) => {
        setDraft({ mode: 'assistM3', length: '10', width: '5', thicknessByDims: '10', ...invalid });
        const { result } = renderHook(() => useQuoteCalculator());

        expect(result.current.isValid).toBe(false);
        expect(result.current.quote.total).toBe(0);
    });

    it.each([
        ['7', 8.5, 8.5],
        ['10', 10.8, 11],
        ['15', 13.5, 13.5],
    ] as const)('uses the selected %s cm coffered slab coefficient and billed rounding', (cofferedSize, raw, billed) => {
        setDraft({ mode: 'assistM3', volumeMode: 'area', area: '100', hasCoffered: 'yes', cofferedSize, thicknessByArea: '' });
        const { result } = renderHook(() => useQuoteCalculator());

        expect(result.current.isValid).toBe(true);
        expect(result.current.rawVolume).toBeCloseTo(raw);
        expect(result.current.quote.volume.billedM3).toBe(billed);
        expect(result.current.quote.total).toBe(billed * 2930);
    });

    it('recalculates pumped fiber, VAT and the billed minimum when the selection changes', () => {
        setDraft({ mode: 'knownM3', m3: '2', type: 'pumped' });
        const { result } = renderHook(() => useQuoteCalculator());

        expect(result.current.quote.volume.billedM3).toBe(3);
        expect(result.current.quote.total).toBe(10959);
        act(() => useCejStore.getState().updateDraft({ hasFiber: true }));

        expect(result.current.quote.unitPricePerM3).toBe(3382.41);
        expect(result.current.quote.fiberSubtotal).toBe(361.11);
        expect(result.current.quote.subtotal).toBe(10508.33);
        expect(result.current.quote.vat).toBe(840.67);
        expect(result.current.quote.total).toBe(11349);

        act(() => useCejStore.getState().updateDraft({ hasFiber: false }));
        expect(result.current.quote.fiberSubtotal).toBe(0);
        expect(result.current.quote.total).toBe(10959);
    });

    it('prevents quoting a persisted unsupported pumped product', () => {
        setDraft({ mode: 'knownM3', m3: '3', strength: '100', type: 'pumped' });
        const { result } = renderHook(() => useQuoteCalculator());

        expect(result.current.isValid).toBe(false);
        expect(result.current.quote.total).toBe(0);
    });

    it.each<Partial<CalculatorState>>([
        { mode: null },
        { mode: 'knownM3', m3: '99' },
        { mode: 'assistM3', volumeMode: 'area', area: '100', hasCoffered: 'yes', cofferedSize: '7' },
    ])('uses only the visible solid-slab dimensions in expert mode despite hidden wizard data: %j', (hidden) => {
        setDraft({ length: '10', width: '5', thicknessByDims: '10', ...hidden });
        const { result } = renderHook(() => useQuoteCalculator('expert'));

        expect(result.current.rawVolume).toBe(4.9);
        expect(result.current.quote.total).toBe(14650);
        expect(result.current.isValid).toBe(true);
    });

    it('keeps the wizard input mode independent of a persisted expert view preference', () => {
        setDraft({ mode: 'knownM3', m3: '2', length: '10', width: '5', thicknessByDims: '10' });
        useCejStore.setState({ viewMode: 'expert' });
        const { result } = renderHook(() => useQuoteCalculator());

        expect(result.current.rawVolume).toBe(2);
        expect(result.current.quote.total).toBe(6760);
    });
});

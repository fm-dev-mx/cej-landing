
import { describe, it, expect } from 'vitest';
import { getCalculatorSteps } from './progress';
import { DEFAULT_CALCULATOR_STATE, CalculatorState } from '@/types/domain';

describe('getCalculatorSteps', () => {
    describe('Known Mode', () => {
        it('should show volume step as active initially', () => {
            const state: CalculatorState = { ...DEFAULT_CALCULATOR_STATE, mode: 'knownM3' };
            const steps = getCalculatorSteps(state);

            expect(steps).toHaveLength(2);
            expect(steps[0]).toMatchObject({ id: 'volume', isActive: true, isCompleted: false });
            expect(steps[1]).toMatchObject({ id: 'service', isActive: false, isCompleted: false });
        });

        it('should move to service step when volume is entered', () => {
            const state: CalculatorState = {
                ...DEFAULT_CALCULATOR_STATE,
                mode: 'knownM3',
                m3: '5'  // string
            };
            const steps = getCalculatorSteps(state);

            expect(steps[0]).toMatchObject({ id: 'volume', isActive: false, isCompleted: true });
            expect(steps[1]).toMatchObject({ id: 'service', isActive: true, isCompleted: false });
        });

        it('should mark all completed when service selected', () => {
            const state: CalculatorState = {
                ...DEFAULT_CALCULATOR_STATE,
                mode: 'knownM3',
                m3: '5',
                type: 'direct',
                strength: '250'
            };
            const steps = getCalculatorSteps(state);

            expect(steps[1]).toMatchObject({ id: 'service', isActive: false, isCompleted: true });
        });
    });

    describe('Assist Mode', () => {
        it('should show workType step initially', () => {
            const state: CalculatorState = { ...DEFAULT_CALCULATOR_STATE, mode: 'assistM3', workType: null };
            const steps = getCalculatorSteps(state);

            expect(steps[0]).toMatchObject({ id: 'workType', isActive: true, isCompleted: false });
        });

        it('should move to dimensions when workType selected', () => {
            const state: CalculatorState = { ...DEFAULT_CALCULATOR_STATE, mode: 'assistM3', workType: 'slab' };
            const steps = getCalculatorSteps(state);

            expect(steps[0].isCompleted).toBe(true);
            expect(steps[1]).toMatchObject({ id: 'dimensions', isActive: true });
        });

        it('should move to specs (thickness) when dimensions entered', () => {
            // Need to ensure thickness is NOT valid to test the step is active.
            // Default thicknessByArea is '12', so we must clear it.
            const state: CalculatorState = {
                ...DEFAULT_CALCULATOR_STATE,
                mode: 'assistM3',
                workType: 'slab',
                volumeMode: 'area', // default
                area: '50',
                thicknessByArea: '' // Force empty
            };
            const steps = getCalculatorSteps(state);

            expect(steps[1].isCompleted).toBe(true);
            expect(steps[2]).toMatchObject({ id: 'specs', isActive: true, label: 'Ingresa el grosor' });
        });

        it('should move to specs (caseton) when dimensions entered and coffered yes', () => {
            // Default cofferedSize is '7', so we must clear it.
            const state: CalculatorState = {
                ...DEFAULT_CALCULATOR_STATE,
                mode: 'assistM3',
                workType: 'slab',
                hasCoffered: 'yes',
                volumeMode: 'area',
                area: '50',
                cofferedSize: null // Force empty
            };
            const steps = getCalculatorSteps(state);

            expect(steps[2]).toMatchObject({ id: 'specs', isActive: true, label: 'Selecciona medida del casetón' });
        });

        it('should move to service when specs completed', () => {
            // Solid slab with thickness
            const state: CalculatorState = {
                ...DEFAULT_CALCULATOR_STATE,
                mode: 'assistM3',
                workType: 'slab',
                volumeMode: 'area',
                area: '50',
                thicknessByArea: '10' // Valid
            };
            const steps = getCalculatorSteps(state);

            expect(steps[2].isCompleted).toBe(true);
            expect(steps[3]).toMatchObject({ id: 'service', isActive: true });
        });
    });
});

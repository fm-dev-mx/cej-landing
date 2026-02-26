
import { describe, it, expect } from 'vitest';
import { getCalculatorSteps, getMissingFields } from './progress';
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

    describe('Bug Regressions', () => {
        it('Bug 1: Zombie state - Switching Dimensions -> Area leaves stale values should be ignored', () => {
            // Setup valid Dimensions state but switch to Area (Zombie)
            const state: CalculatorState = {
                ...DEFAULT_CALCULATOR_STATE,
                mode: 'assistM3',
                workType: 'slab',
                volumeMode: 'area', // Area mode
                length: '5', // Stale dimensions
                width: '4',
                thicknessByDims: '10',
                area: '', // Empty area
                thicknessByArea: '',
            };

            const steps = getCalculatorSteps(state);
            // Step 2 (Dimensions/Area) should be active because Area is missing
            const dimsStep = steps.find(s => s.id === 'dimensions');

            expect(dimsStep?.isCompleted).toBe(false);
            expect(dimsStep?.isActive).toBe(true);
        });

        it('Bug 2: Area mode - specific fields missing check', () => {
            const state: CalculatorState = {
                ...DEFAULT_CALCULATOR_STATE,
                mode: 'assistM3',
                workType: 'slab',
                volumeMode: 'area',
                area: '',
            };
            // Area missing
            expect(getMissingFields(state)).toContain('area');

            // Fill area
            const filledState: CalculatorState = { ...state, area: '50', thicknessByArea: '10' };
            expect(getMissingFields(filledState)).not.toContain('area');
        });

        it('Bug 3: Known Quantity - Service step active if partial service data', () => {
            const state: CalculatorState = {
                ...DEFAULT_CALCULATOR_STATE,
                mode: 'knownM3',
                m3: '5',
                strength: '250',
                type: null // Service type missing
            };

            const steps = getCalculatorSteps(state);
            const serviceStep = steps.find(s => s.id === 'service');

            // It should be Active (because it is NOT completed)
            expect(serviceStep?.isActive).toBe(true);
            expect(serviceStep?.isCompleted).toBe(false);

            // Missing fields should include type
            const missing = getMissingFields(state);
            expect(missing).toContain('type');
            expect(missing).not.toContain('strength');
        });
    });
});

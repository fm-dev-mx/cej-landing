
import { CalculatorState } from '@/types/domain';
import { MIN_AREA_M2, MIN_LENGTH_M, MIN_WIDTH_M, MIN_THICKNESS_CM } from '@/lib/schemas/calculator';

export interface ProgressStep {
    id: string;
    label: string;
    isCompleted: boolean;
    isActive: boolean;
}

export type CalculatorFieldId =
    | 'm3'
    | 'workType'
    | 'length'
    | 'width'
    | 'area'
    | 'thicknessByDims'
    | 'thicknessByArea'
    | 'cofferedSize'
    | 'strength'
    | 'type';

/**
 * Returns a list of fields that are required but missing or invalid in the current mode.
 * This is the SINGLE SOURCE OF TRUTH for the form state validity.
 */
export function getMissingFields(state: CalculatorState): CalculatorFieldId[] {
    const missing: CalculatorFieldId[] = [];
    const { mode } = state;

    if (mode === 'knownM3') {
        // Volume Check
        if (!state.m3 || parseFloat(state.m3) <= 0) {
            missing.push('m3');
        }
        // Service Check (Both required)
        if (!state.strength) missing.push('strength');
        if (!state.type) missing.push('type');

    } else if (mode === 'assistM3') {
        // 1. WorkType
        if (!state.workType) {
            missing.push('workType');
            // Fail fast for step progression logic implies we stop looking?
            // But for "live validation" on fields (if user forces interaction), we want truth.
            // However, usually fields are hidden until workType selected.
        }

        // 2. Dimensions / Area
        // We always check these based on volumeMode, even if WorkType is missing (though UI might hide them)
        if (state.volumeMode === 'dimensions') {
            if (!state.length || parseFloat(state.length) < MIN_LENGTH_M) missing.push('length');
            if (!state.width || parseFloat(state.width) < MIN_WIDTH_M) missing.push('width');
        } else {
            if (!state.area || parseFloat(state.area) < MIN_AREA_M2) missing.push('area');
        }

        // 3. Specs (Thickness or Coffered)
        let isCoffered = false;
        if (state.workType === 'slab') {
            isCoffered = state.hasCoffered === 'yes';
        }

        if (isCoffered) {
            if (!state.cofferedSize) missing.push('cofferedSize');
        } else {
            // Solid slab or other element (walls/footings also have thickness)
            const val = state.volumeMode === 'dimensions' ? state.thicknessByDims : state.thicknessByArea;
            // Note: thickness defaults to '12' or '10', so usually not missing unless cleared.
            if (!val || parseFloat(val) < MIN_THICKNESS_CM) {
                missing.push(state.volumeMode === 'dimensions' ? 'thicknessByDims' : 'thicknessByArea');
            }
        }

        // 4. Service (Strength/Type) - Always required at the end
        if (!state.strength) missing.push('strength');
        if (!state.type) missing.push('type');
    }

    return missing;
}

export function getCalculatorSteps(state: CalculatorState): ProgressStep[] {
    const steps: ProgressStep[] = [];
    const missing = getMissingFields(state);
    const { mode } = state;

    // Helper to check if a specific set of fields are missing
    const isMissing = (fields: CalculatorFieldId[]) => fields.some(f => missing.includes(f));

    if (mode === 'knownM3') {
        const volumeMissing = isMissing(['m3']);
        const serviceMissing = isMissing(['strength', 'type']);

        steps.push({
            id: 'volume',
            label: 'Ingresa el volumen (m³)',
            isCompleted: !volumeMissing,
            isActive: volumeMissing // Active if missing
        });

        steps.push({
            id: 'service',
            label: 'Selecciona resistencia y tipo de servicio',
            isCompleted: !serviceMissing, // Completed ONLY if both are present
            isActive: !volumeMissing && serviceMissing // Active if volume done but service not
        });

    } else if (mode === 'assistM3') {
        const workTypeMissing = isMissing(['workType']);

        // Dimensions fields depend on volumeMode
        const dimFields: CalculatorFieldId[] = state.volumeMode === 'dimensions'
            ? ['length', 'width']
            : ['area'];
        const dimsMissing = isMissing(dimFields);

        // Specs fields
        const specsFields: CalculatorFieldId[] = [];
        if (state.workType === 'slab' && state.hasCoffered === 'yes') {
            specsFields.push('cofferedSize');
        } else {
            specsFields.push(state.volumeMode === 'dimensions' ? 'thicknessByDims' : 'thicknessByArea');
        }
        const specsMissing = isMissing(specsFields);

        const serviceMissing = isMissing(['strength', 'type']);

        // Step 1: Work Type
        steps.push({
            id: 'workType',
            label: 'Selecciona el tipo de obra',
            isCompleted: !workTypeMissing,
            isActive: workTypeMissing
        });

        // Step 2: Measurements
        steps.push({
            id: 'dimensions',
            label: 'Ingresa las medidas',
            isCompleted: !workTypeMissing && !dimsMissing,
            isActive: !workTypeMissing && dimsMissing
        });

        // Step 3: Specs
        let specsLabel = 'Ingresa el grosor';
        if (state.workType === 'slab' && state.hasCoffered === 'yes') specsLabel = 'Selecciona medida del casetón';

        steps.push({
            id: 'specs',
            label: specsLabel,
            isCompleted: !workTypeMissing && !dimsMissing && !specsMissing,
            isActive: !workTypeMissing && !dimsMissing && specsMissing
        });

        // Step 4: Service
        steps.push({
            id: 'service',
            label: 'Selecciona resistencia y tipo de servicio',
            isCompleted: !workTypeMissing && !dimsMissing && !specsMissing && !serviceMissing,
            isActive: !workTypeMissing && !dimsMissing && !specsMissing && serviceMissing
        });
    }

    return steps;
}

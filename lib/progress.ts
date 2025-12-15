
import { CalculatorState } from '@/types/domain';

export interface ProgressStep {
    id: string;
    label: string;
    isCompleted: boolean;
    isActive: boolean;
}

export function getCalculatorSteps(state: CalculatorState): ProgressStep[] {
    const steps: ProgressStep[] = [];
    const { mode } = state;

    if (mode === 'knownM3') {
        const hasVolume = parseFloat(state.m3) > 0;
        const hasService = !!state.type && !!state.strength;

        steps.push({
            id: 'volume',
            label: 'Ingresa el volumen (m³)',
            isCompleted: hasVolume,
            isActive: !hasVolume
        });

        steps.push({
            id: 'service',
            label: 'Selecciona resistencia y tipo de servicio',
            isCompleted: hasService,
            isActive: hasVolume && !hasService
        });

    } else if (mode === 'assistM3') {
        const hasWorkType = !!state.workType;

        // Dimensions check
        let hasDimensions = false;
        if (state.volumeMode === 'dimensions') {
            hasDimensions = parseFloat(state.length) > 0 && parseFloat(state.width) > 0;
        } else {
            hasDimensions = parseFloat(state.area) > 0;
        }

        // Refined steps for Assist:
        // 1. Tipo de obra
        // 2. Medidas
        // 3. Especificaciones (Losa details if needed, else Service)

        steps.push({
            id: 'workType',
            label: 'Selecciona el tipo de obra',
            isCompleted: hasWorkType,
            isActive: !hasWorkType
        });

        steps.push({
            id: 'dimensions',
            label: 'Ingresa las medidas',
            isCompleted: hasDimensions,
            isActive: hasWorkType && !hasDimensions
        });

        // Step 3: Thickness / Coffered details
        let hasSpecs = false;
        let specsLabel = 'Especificaciones';

        if (state.workType === 'slab') {
            if (state.hasCoffered === 'yes') {
                hasSpecs = !!state.cofferedSize;
                specsLabel = 'Selecciona medida del casetón';
            } else {
                // Solid slab
                hasSpecs = state.volumeMode === 'dimensions'
                    ? parseFloat(state.thicknessByDims) > 0
                    : parseFloat(state.thicknessByArea) > 0;
                specsLabel = 'Ingresa el grosor';
            }
        } else {
            // Other elements usually have thickness input too
            hasSpecs = state.volumeMode === 'dimensions'
                ? parseFloat(state.thicknessByDims) > 0
                : parseFloat(state.thicknessByArea) > 0;
            specsLabel = 'Ingresa el grosor';
        }

        steps.push({
            id: 'specs',
            label: specsLabel,
            isCompleted: hasSpecs,
            isActive: hasWorkType && hasDimensions && !hasSpecs
        });

        // Final step: Service (Strength/Type)
        const hasService = !!state.type && !!state.strength;
        steps.push({
            id: 'service',
            label: 'Selecciona resistencia y tipo de servicio',
            isCompleted: hasService,
            isActive: hasWorkType && hasDimensions && hasSpecs && !hasService
        });
    }

    return steps;
}

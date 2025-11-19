// components/Calculator/types.ts

import type { Strength, ConcreteType, QuoteBreakdown } from '@/lib/pricing';

export type { Strength, ConcreteType, QuoteBreakdown };

export type CalculatorMode = 'knownM3' | 'assistM3';
export type AssistVolumeMode = 'dimensions' | 'area';
export type Step = 1 | 2 | 3 | 4;
export type CofferedSize = '7' | '10'; // Nuevo tipo para el tamaño

export type WorkTypeId =
    | 'slab'
    | 'lightInteriorFloor'
    | 'vehicleFloor'
    | 'footings'
    | 'walls';

export type WorkTypeConfig = {
    id: WorkTypeId;
    label: string;
    description: string;
    recommendedStrength: Strength;
};

export type CalculatorState = {
    step: Step;
    mode: CalculatorMode | null;
    volumeMode: AssistVolumeMode;
    strength: Strength;
    type: ConcreteType;
    m3: string;
    workType: WorkTypeId;
    length: string;
    width: string;
    thicknessByDims: string;
    area: string;
    thicknessByArea: string;
    hasCoffered: 'yes' | 'no';
    cofferedSize: CofferedSize | null; // Nuevo campo
};

export const STRENGTHS: Strength[] = ['100', '150', '200', '250', '300'];

export const CONCRETE_TYPES: { value: ConcreteType; label: string }[] = [
    { value: 'direct', label: 'Tiro directo' },
    { value: 'pumped', label: 'Bombeado' },
];

export const WORK_TYPES: WorkTypeConfig[] = [
    {
        id: 'slab',
        label: 'Losa',
        description: 'Azoteas y losas de entrepiso.',
        recommendedStrength: '200',
    },
    {
        id: 'lightInteriorFloor',
        label: 'Piso interior ligero',
        description: 'Habitaciones y áreas interiores sin vehículos.',
        recommendedStrength: '150',
    },
    {
        id: 'vehicleFloor',
        label: 'Piso exterior / vehículos',
        description: 'Cochera, patios de maniobras ligeros.',
        recommendedStrength: '200',
    },
    {
        id: 'footings',
        label: 'Cimientos / zapatas',
        description: 'Cimentaciones corridas y zapatas.',
        recommendedStrength: '200',
    },
    {
        id: 'walls',
        label: 'Muros / industrial pesado',
        description: 'Muros estructurales y cargas pesadas.',
        recommendedStrength: '250',
    },
];

export const ESTIMATE_LEGEND =
    'Los resultados son estimados. Para confirmar el volumen y el precio final realizamos una visita de volumetría sin costo, una vez programado el pedido y con la obra lista para colar.';

export const STORAGE_KEY = 'cej_calculator_v1';

export const DEFAULT_CALCULATOR_STATE: CalculatorState = {
    step: 1,
    mode: null,
    volumeMode: 'dimensions',
    strength: '200',
    type: 'direct',
    m3: '',
    workType: 'slab',
    length: '',
    width: '',
    thicknessByDims: '12',
    area: '',
    thicknessByArea: '12',
    hasCoffered: 'no',
    cofferedSize: null, // Valor inicial nulo
};

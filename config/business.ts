// config/business.ts

import type {
    ConcreteType,
    Strength,
    WorkTypeConfig,
    PriceTable,
    VolumeTier,
} from '@/components/Calculator/types';

// --- Global business configuration ---

// 8% VAT (border rate)
export const VAT_RATE = 0.08;

// Volume increment (m³)
export const M3_STEP = 0.5;

export const CURRENCY = 'MXN';

export const STORAGE_KEY = 'cej_calculator_v1';

export const ESTIMATE_LEGEND =
    'Los resultados son estimados. Para confirmar el volumen y el precio final realizamos una visita de volumetría sin costo, una vez programado el pedido y con la obra lista para colar.';

// --- Volume rules ---

export const MIN_M3_BY_TYPE: Record<ConcreteType, number> = {
    direct: 2,
    pumped: 3,
};

export const CASETON_FACTORS = {
    // Lightened slab (with coffers/blocks)
    withCofferedSlab: 0.71,
    // Solid slab (no coffers)
    solidSlab: 0.98,
} as const;

// --- Catalogs and options ---

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

// --- Pricing table ---

// Local helpers to define price tiers in integer cents
const pesos = (n: number): number => Math.round(n * 100);

const tier = (
    minM3: number,
    unitPricePesos: number,
    maxM3?: number,
): VolumeTier => ({
    minM3,
    maxM3,
    pricePerM3Cents: pesos(unitPricePesos),
});

/*
  Base prices (without VAT)
  - Direct pour: Tier 1 (2–2.5 m³), Tier 2 (>= 3 m³)
  - Pumped: Tier 1 (3–4.5 m³), Tier 2 (>= 5 m³)
*/
export const PRICE_TABLE: PriceTable = {
    base: {
        direct: {
            '100': [tier(2, 2231, 2.5), tier(3, 2082)],
            '150': [tier(2, 2509, 2.5), tier(3, 2269)],
            '200': [tier(2, 2731, 2.5), tier(3, 2481)],
            '250': [tier(2, 3018, 2.5), tier(3, 2769)],
            '300': [tier(2, 3091, 2.5), tier(3, 3035)],
        },
        pumped: {
            '100': [tier(3, 2527, 4.5), tier(5, 2481)],
            '150': [tier(3, 2758, 4.5), tier(5, 2666)],
            '200': [tier(3, 3008, 4.5), tier(5, 2958)],
            '250': [tier(3, 3259, 4.5), tier(5, 3167)],
            '300': [tier(3, 3478, 4.5), tier(5, 3385)],
        },
    },
};

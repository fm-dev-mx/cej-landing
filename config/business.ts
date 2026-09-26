// config/business.ts

import type {
    ConcreteType,
    ConcreteOption,
    WorkTypeConfig,
    PriceTable,
    VolumeTier,
    CofferedSize
} from '@/components/Calculator/types';
import { env } from '@/config/env';

// --- Global business configuration ---

export const VAT_RATE = 0.08; // 8% VAT (border rate)
export const M3_STEP = 0.5; // Volume increment (m³)
export const CURRENCY = 'MXN';
export const FIBER_PRICE_PER_M3 = 130;
export const STORAGE_KEY = 'cej_calculator_v2';

// Quote specific constants
export const QUOTE_VALIDITY_DAYS = 7;
export const SUPPORT_PHONE_LABEL = env.NEXT_PUBLIC_PHONE;
export const WEBSITE_URL_LABEL = env.NEXT_PUBLIC_SITE_URL;

// --- Datos Maestros del Negocio (Single Source of Truth) ---
export const BUSINESS_INFO = {
    name: env.NEXT_PUBLIC_BRAND_NAME,
    email: 'contacto@concretodejuarez.com',
    address: {
        street: 'Av. Ejército Nacional 6225, Local 27',
        colony: 'Centro Comercial San José',
        city: 'Ciudad Juárez',
        region: 'CHIH',
        postalCode: '32528',
        country: 'MX'
    },
    geo: {
        lat: 31.7138,
        lng: -106.4447
    },
    openingHours: [
        { dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '08:00', closes: '17:00' },
        { dayOfWeek: ['Saturday'], opens: '08:00', closes: '13:00' }
    ]
};

export const ESTIMATE_LEGEND =
    'Los precios pueden variar según condiciones de obra, distancia y volumen final.';

// --- Volume rules ---

export const MIN_M3_BY_TYPE: Record<ConcreteType, number> = {
    direct: 2,
    pumped: 3,
};

export const MIN_M3_OVERRIDES: Partial<Record<ConcreteOption, number>> = {
    'mortero 90': 1,
    'MR 42.5': 1,
};

// --- Slab Specifications ---

type SlabSpec = {
    label: string;
    totalThicknessCm: number;
    coefficient: number;
};

export const COFFERED_SPECS: Record<CofferedSize, SlabSpec> = {
    '7': {
        label: 'Casetón 7cm',
        totalThicknessCm: 12,
        coefficient: 0.085
    },
    '10': {
        label: 'Casetón 10cm',
        totalThicknessCm: 15,
        coefficient: 0.108
    },
    '15': {
        label: 'Casetón 15cm',
        totalThicknessCm: 20,
        coefficient: 0.135
    }
};

export const CASETON_FACTORS = {
    solidSlab: 0.98,
} as const;

// --- Catalogs and options ---

export const CONCRETE_OPTIONS: { value: ConcreteOption; label: string }[] = [
    { value: '100', label: 'f’c 100 kg/cm²' },
    { value: '150', label: 'f’c 150 kg/cm²' },
    { value: '200', label: 'f’c 200 kg/cm²' },
    { value: '210', label: 'f’c 210 kg/cm²' },
    { value: '250', label: 'f’c 250 kg/cm²' },
    { value: '300', label: 'f’c 300 kg/cm²' },
    { value: '150 3/8', label: 'f’c 150 · agregado 3/8' },
    { value: '200 3/8', label: 'f’c 200 · agregado 3/8' },
    { value: '250 3/8', label: 'f’c 250 · agregado 3/8' },
    { value: 'mortero 90', label: 'MOREST 90' },
    { value: 'MR 42.5', label: 'MR 42.5' },
];

export function getConcreteOptionLabel(option: ConcreteOption): string {
    return CONCRETE_OPTIONS.find((item) => item.value === option)?.label ?? option;
}

export function getQuoteProductLabel(option: ConcreteOption): string {
    const label = getConcreteOptionLabel(option);
    return option === 'mortero 90' || option === 'MR 42.5'
        ? label
        : `Concreto ${label}`;
}

export const CONCRETE_TYPES: { value: ConcreteType; label: string }[] = [
    { value: 'direct', label: 'Tiro directo' },
    { value: 'pumped', label: 'Servicio de Bomba' },
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

const pesos = (n: number): number => Math.round(n * 100);

const tier = (
    minM3: number,
    unitPricePesosIncludingVat: number,
    maxM3?: number,
): VolumeTier => ({
    minM3,
    maxM3,
    pricePerM3Cents: pesos(unitPricePesosIncludingVat),
});

const directTiers = (twoM3: number, twoAndHalfM3: number, threeOrMoreM3: number): VolumeTier[] => [
    tier(2, twoM3, 2),
    tier(2.5, twoAndHalfM3, 2.5),
    tier(3, threeOrMoreM3),
];

export const PRICE_TABLE: PriceTable = {
    base: {
        direct: {
            '100': directTiers(2884, 2659, 2534),
            '150': directTiers(3089, 2864, 2639),
            '200': directTiers(3380, 3155, 2930),
            '210': directTiers(3613, 3388, 3163),
            '250': directTiers(3717, 3492, 3267),
            '300': directTiers(3823, 3598, 3373),
            '150 3/8': directTiers(3659, 3459, 3259),
            '200 3/8': directTiers(3877, 3677, 3477),
            '250 3/8': directTiers(3994, 3794, 3594),
            'mortero 90': [tier(1, 4454)],
            'MR 42.5': [tier(1, 3397)],
        },
        pumped: {
            '150': [tier(3, 3411, 3.5), tier(4, 3261, 4.5), tier(5, 3111)],
            '200': [tier(3, 3653, 3.5), tier(4, 3503, 4.5), tier(5, 3353)],
            '210': [tier(3, 3844, 3.5), tier(4, 3654, 4.5), tier(5, 3452)],
            '250': [tier(3, 3885, 3.5), tier(4, 3735, 4.5), tier(5, 3585)],
            '300': [tier(3, 4045, 3.5), tier(4, 3895, 4.5), tier(5, 3745)],
        },
    },
    extras: {
        fibra_poly: pesos(FIBER_PRICE_PER_M3),
    }
};

export function isConcreteOptionAvailable(option: ConcreteOption, type: ConcreteType): boolean {
    return Boolean(PRICE_TABLE.base[type][option]?.length);
}

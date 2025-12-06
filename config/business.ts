// config/business.ts

import type {
    ConcreteType,
    Strength,
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
export const STORAGE_KEY = 'cej_calculator_v1';

// Quote specific constants
export const QUOTE_VALIDITY_DAYS = 7;
export const SUPPORT_PHONE_LABEL = env.NEXT_PUBLIC_PHONE;
export const WEBSITE_URL_LABEL = env.NEXT_PUBLIC_SITE_URL;

// --- NUEVO: Datos Maestros del Negocio (Single Source of Truth) ---
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
    'Precios sujetos a cambio sin previo aviso. La volumetría final se valida con visita técnica gratuita.';

// --- Volume rules ---

export const MIN_M3_BY_TYPE: Record<ConcreteType, number> = {
    direct: 2,
    pumped: 3,
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

export const STRENGTHS: Strength[] = ['100', '150', '200', '250', '300'];

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
    unitPricePesos: number,
    maxM3?: number,
): VolumeTier => ({
    minM3,
    maxM3,
    pricePerM3Cents: pesos(unitPricePesos),
});

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

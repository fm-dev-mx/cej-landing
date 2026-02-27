// config/business.ts
import { PricingRulesSchema, type PricingRules } from '@/lib/schemas/pricing';
import { env } from '@/config/env';
import type { WorkTypeConfig, Strength, ConcreteType, CofferedSize } from '@/types/domain';

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

// --- Constants & Configuration ---

export const VAT_RATE = 0.08; // 8% VAT (border rate)
export const M3_STEP = 0.5; // Volume increment (m³)
export const CURRENCY = 'MXN';
export const QUOTE_VALIDITY_DAYS = 7;

export const ESTIMATE_LEGEND =
    'Precios sujetos a cambio sin previo aviso. La volumetría final se valida con visita técnica gratuita.';

// --- Construction Specs ---

export const MIN_M3_BY_TYPE: Record<ConcreteType, number> = {
    direct: 3,
    pumped: 3,
};

type SlabSpec = {
    label: string;
    totalThicknessCm: number;
    coefficient: number;
};

export const COFFERED_SPECS: Record<CofferedSize, SlabSpec> = {
    '7': { label: 'Casetón 7cm', totalThicknessCm: 12, coefficient: 0.085 },
    '10': { label: 'Casetón 10cm', totalThicknessCm: 15, coefficient: 0.108 },
    '15': { label: 'Casetón 15cm', totalThicknessCm: 20, coefficient: 0.135 }
};

export const CASETON_FACTORS = {
    solidSlab: 0.98,
} as const;

// --- Catalogs ---

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

// --- PRICING RULES (FALLBACK / LEGACY ADAPTER) ---
// This object is the static fallback used when DB connection fails or is not yet configured.
// It matches the PricingRulesSchema strictly.
// @deprecated - This static config will be replaced by DB fetching in Phase 4 (SaaS).
// Currently used as Fail-Open fallback.

const rawPricingConfig = {
    version: 2,
    lastUpdated: new Date().toISOString(),
    currency: CURRENCY,
    vatRate: VAT_RATE,
    minOrderQuantity: MIN_M3_BY_TYPE,
    base: {
        direct: {
            '100': [{ minM3: 3, pricePerM3Cents: 217036 }],
            '150': [{ minM3: 3, pricePerM3Cents: 235646 }],
            '200': [{ minM3: 3, pricePerM3Cents: 256946 }],
            '250': [{ minM3: 3, pricePerM3Cents: 285646 }],
            '300': [{ minM3: 3, pricePerM3Cents: 312496 }],
        },
        pumped: {
            '100': [], // Left empty intentionally as it was N/A in legacy report
            '150': [{ minM3: 3, maxM3: 3.5, pricePerM3Cents: 307956 }, { minM3: 4, maxM3: 4.5, pricePerM3Cents: 284716 }, { minM3: 5, pricePerM3Cents: 275456 }],
            '200': [{ minM3: 3, maxM3: 3.5, pricePerM3Cents: 332866 }, { minM3: 4, maxM3: 4.5, pricePerM3Cents: 309626 }, { minM3: 5, pricePerM3Cents: 304626 }],
            '250': [{ minM3: 3, maxM3: 3.5, pricePerM3Cents: 357956 }, { minM3: 4, maxM3: 4.5, pricePerM3Cents: 334716 }, { minM3: 5, pricePerM3Cents: 325456 }],
            '300': [{ minM3: 3, maxM3: 3.5, pricePerM3Cents: 379256 }, { minM3: 4, maxM3: 4.5, pricePerM3Cents: 356016 }, { minM3: 5, pricePerM3Cents: 346756 }],
        },
    },
    additives: [
        {
            id: 'fiber',
            label: 'Fibra de Refuerzo',
            description: 'Micro-refuerzo para reducir grietas',
            priceCents: 15000,
            pricingModel: 'per_m3',
            active: true
        },
        {
            id: 'accelerant',
            label: 'Acelerante (1%)',
            description: 'Fraguado rápido para clima frío',
            priceCents: 18000,
            pricingModel: 'per_m3',
            active: true
        }
    ]
};

// Validate fallback config at build time
export const FALLBACK_PRICING_RULES: PricingRules = PricingRulesSchema.parse(rawPricingConfig);

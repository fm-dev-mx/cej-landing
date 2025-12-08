// types/domain.ts
import { z } from 'zod';
import type { PricingRules, VolumeTier } from '@/lib/schemas/pricing';
import {
    ConcreteTypeEnum,
    StrengthEnum
} from '@/lib/schemas/pricing';

// --- 1. Core Primitives (Inferred where possible) ---
export type Strength = z.infer<typeof StrengthEnum>;
export type ConcreteType = z.infer<typeof ConcreteTypeEnum>;

export type CalculatorMode = 'knownM3' | 'assistM3';
export type AssistVolumeMode = 'dimensions' | 'area';
export type CofferedSize = '7' | '10' | '15';

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
    icon?: string;
};

// --- 2. Calculator State ---
export type CalculatorState = {
    mode: CalculatorMode;
    volumeMode: AssistVolumeMode;
    strength: Strength;
    type: ConcreteType;
    m3: string;
    workType: WorkTypeId | null;
    length: string;
    width: string;
    thicknessByDims: string;
    area: string;
    thicknessByArea: string;
    hasCoffered: 'yes' | 'no';
    cofferedSize: CofferedSize | null;

    // Phase 2: Expert Fields
    additives: string[];
    showExpertOptions: boolean;
};

export const DEFAULT_CALCULATOR_STATE: CalculatorState = {
    mode: 'knownM3',
    volumeMode: 'dimensions',
    strength: '200',
    type: 'direct',
    m3: '',
    workType: null,
    length: '',
    width: '',
    thicknessByDims: '12',
    area: '',
    thicknessByArea: '12',
    hasCoffered: 'no',
    cofferedSize: '7',
    additives: [],
    showExpertOptions: false,
};

// --- 3. Pricing & Quotes ---
export type { PricingRules, VolumeTier };

export type NormalizedVolume = {
    requestedM3: number;
    roundedM3: number;
    minM3ForType: number;
    billedM3: number;
    isBelowMinimum: boolean;
};

export type QuoteLineItem = {
    label: string;
    value: number; // Formatted currency
    type: 'base' | 'additive' | 'surcharge';
};

export type QuoteBreakdown = {
    volume: NormalizedVolume;
    strength: Strength;
    concreteType: ConcreteType;

    // Financials
    unitPricePerM3: number;
    baseSubtotal: number;
    additivesSubtotal: number;
    subtotal: number;
    vat: number;
    total: number;

    // Metadata
    breakdownLines: QuoteLineItem[];
    calculationDetails?: {
        formula: string;
        factorUsed?: number;
    };
};

export type QuoteWarning =
    | {
        code: 'BELOW_MINIMUM';
        minM3: number;
        billedM3: number;
        typeLabel: string;
    }
    | {
        code: 'ROUNDING_POLICY';
        requestedM3: number;
        billedM3: number;
    }
    | {
        code: 'ROUNDING_ADJUSTMENT';
        billedM3: number;
    }
    | null;

// --- 4. Order & Cart ---
export type CartItem = {
    id: string;
    timestamp: number;
    inputs: CalculatorState;
    results: QuoteBreakdown;
    config: {
        label: string;
    };
};

export type CustomerInfo = {
    name: string;
    phone: string;
    visitorId?: string;
    email?: string;
};

export type OrderPayload = {
    folio: string;
    customer: CustomerInfo;
    items: {
        id: string;
        label: string;
        volume: number;
        service: string;
        subtotal: number;
        additives?: string[];
    }[];
    financials: {
        total: number;
        currency: string;
    };
    metadata: {
        source: 'web_calculator';
        pricing_version?: number;
        utm_source?: string;
        utm_medium?: string;
        userAgent?: string;
    };
};

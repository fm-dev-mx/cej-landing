// types/domain.ts

// --- 1. Core Primitives ---
export type Strength = '100' | '150' | '200' | '250' | '300';
export type ConcreteType = 'direct' | 'pumped';
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
};

// --- 3. Pricing & Quotes ---
export type VolumeTier = {
    minM3: number;
    maxM3?: number;
    pricePerM3Cents: number;
};

export type BasePriceTable = Record<
    ConcreteType,
    Record<Strength, VolumeTier[]>
>;

export type PriceTable = {
    base: BasePriceTable;
};

export type NormalizedVolume = {
    requestedM3: number;
    roundedM3: number;
    minM3ForType: number;
    billedM3: number;
    isBelowMinimum: boolean;
};

export type QuoteBreakdown = {
    volume: NormalizedVolume;
    strength: Strength;
    concreteType: ConcreteType;
    unitPricePerM3: number; // MXN without VAT
    subtotal: number;       // MXN without VAT
    vat: number;            // MXN (IVA)
    total: number;          // MXN with VAT
    calculationDetails?: {
        formula: string;
        factorUsed?: number;
        effectiveThickness?: number;
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

// --- 4. Order & Cart (Previously in types/order.ts) ---
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
    }[];
    financials: {
        total: number;
        currency: string;
    };
    metadata: {
        source: 'web_calculator';
        utm_source?: string;
        utm_medium?: string;
        userAgent?: string;
        landingPage?: string;
    };
};

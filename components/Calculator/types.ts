// components/Calculator/types.ts

export type Strength = '100' | '150' | '200' | '210' | '250' | '300';
export type ConcreteOption =
    | Strength
    | '150 3/8'
    | '200 3/8'
    | '250 3/8'
    | 'mortero 90'
    | 'MR 42.5';
export type ConcreteType = 'direct' | 'pumped';

export type CalculatorMode = 'knownM3' | 'assistM3';
export type AssistVolumeMode = 'dimensions' | 'area';

export type Step = 1 | 2 | 3 | 4 | 5;

// UPDATED: Added '15' to standard sizes
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

export type CalculatorState = {
    step: Step;
    mode: CalculatorMode | null;
    volumeMode: AssistVolumeMode;
    strength: ConcreteOption;
    type: ConcreteType;
    hasFiber: boolean;
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

export type NormalizedVolume = {
    requestedM3: number;
    roundedM3: number;
    minM3ForType: number;
    billedM3: number;
    isBelowMinimum: boolean;
};

export type VolumeTier = {
    minM3: number;
    maxM3?: number;
    pricePerM3Cents: number; // Configured rate from the price list, including VAT
};

export type BasePriceTable = Record<
    ConcreteType,
    Partial<Record<ConcreteOption, VolumeTier[]>>
>;

export type PriceTable = {
    base: BasePriceTable;
    extras?: Record<string, number>; // Listed prices, including VAT
};

export type QuoteBreakdown = {
    volume: NormalizedVolume;
    strength: ConcreteOption;
    concreteType: ConcreteType;
    hasFiber: boolean;
    unitPricePerM3: number; // MXN per m³ for concrete, excluding VAT and fiber
    fiberSubtotal: number;  // MXN for fiber, excluding VAT
    subtotal: number;       // MXN without VAT
    vat: number;            // MXN (IVA)
    total: number;          // MXN with VAT
    // New metadata for transparency in UI
    calculationDetails?: {
        formula: string;
        factorUsed?: number;
        effectiveThickness?: number;
    };
};

// Moved here to prevent circular dependencies
export const DEFAULT_CALCULATOR_STATE: CalculatorState = {
    step: 1,
    mode: null,
    volumeMode: 'dimensions',
    strength: '200',
    type: 'direct',
    hasFiber: false,
    m3: '',
    workType: null,
    length: '',
    width: '',
    thicknessByDims: '12',
    area: '',
    thicknessByArea: '12',
    hasCoffered: 'yes',
    cofferedSize: '7',
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

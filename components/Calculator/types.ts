// components/Calculator/types.ts

export type Strength = '100' | '150' | '200' | '250' | '300';
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
    pricePerM3Cents: number;
};

export type BasePriceTable = Record<
    ConcreteType,
    Record<Strength, VolumeTier[]>
>;

export type PriceTable = {
    base: BasePriceTable;
};

export type QuoteBreakdown = {
    volume: NormalizedVolume;
    strength: Strength;
    concreteType: ConcreteType;
    unitPricePerM3: number; // MXN without VAT
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

// components/Calculator/types.ts

// Pure type definitions.
// Constants and business values have been moved to @/config/business.

export type Strength = '100' | '150' | '200' | '250' | '300';
export type ConcreteType = 'direct' | 'pumped';

export type CalculatorMode = 'knownM3' | 'assistM3';
export type AssistVolumeMode = 'dimensions' | 'area';
export type Step = 1 | 2 | 3 | 4;
export type CofferedSize = '7' | '10';

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
};

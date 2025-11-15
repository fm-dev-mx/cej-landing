// lib/pricing.ts

export type Strength = '100' | '150' | '200' | '250' | '300';
export type ConcreteType = 'direct' | 'pumped';

export const MXN = 'MXN';

// 8% VAT for the quoted total
export const VAT_RATE = 0.08;
export const M3_STEP = 0.5 as const;

// Minimum volume by concrete type (in m³)
export const MIN_M3_BY_TYPE: Record<ConcreteType, number> = {
    direct: 2,
    pumped: 3,
};

export const CASETON_FACTORS = {
    withCofferedSlab: 0.71, // slab with coffers / voids
    solidSlab: 0.98,        // solid slab (no coffers)
} as const;

// ---------- Volume helpers ----------

export type NormalizedVolume = {
    requestedM3: number;
    roundedM3: number;
    minM3ForType: number;
    billedM3: number;
    isBelowMinimum: boolean;
};

export function roundUpToStep(value: number, step: number): number {
    if (!Number.isFinite(value) || value <= 0) return 0;
    const scale = 1 / step;
    return Math.ceil(value * scale - 1e-9) / scale;
}

export function normalizeVolume(
    requestedM3: number,
    type: ConcreteType,
): NormalizedVolume {
    const safeRequested = Number.isFinite(requestedM3)
        ? Math.max(requestedM3, 0)
        : 0;

    const minM3ForType = MIN_M3_BY_TYPE[type];
    const roundedM3 = roundUpToStep(safeRequested, M3_STEP);
    const billedM3 = Math.max(roundedM3, minM3ForType);
    const isBelowMinimum = safeRequested > 0 && safeRequested < minM3ForType;

    return {
        requestedM3: safeRequested,
        roundedM3,
        minM3ForType,
        billedM3,
        isBelowMinimum,
    };
}

// ---------- Volume calculators for Flow B ----------

export type SlabDimensionsInput = {
    lengthM: number;
    widthM: number;
    thicknessCm: number;
    hasCofferedSlab: boolean;
};

export type SlabAreaInput = {
    areaM2: number;
    thicknessCm: number;
    hasCofferedSlab: boolean;
};

export function calcVolumeFromDimensions(input: SlabDimensionsInput): number {
    const { lengthM, widthM, thicknessCm, hasCofferedSlab } = input;

    if (lengthM <= 0 || widthM <= 0 || thicknessCm <= 0) return 0;

    const thicknessM = thicknessCm / 100;
    const baseVolume = lengthM * widthM * thicknessM;
    const factor = hasCofferedSlab
        ? CASETON_FACTORS.withCofferedSlab
        : CASETON_FACTORS.solidSlab;

    return baseVolume * factor;
}

export function calcVolumeFromArea(input: SlabAreaInput): number {
    const { areaM2, thicknessCm, hasCofferedSlab } = input;

    if (areaM2 <= 0 || thicknessCm <= 0) return 0;

    const thicknessM = thicknessCm / 100;
    const baseVolume = areaM2 * thicknessM;
    const factor = hasCofferedSlab
        ? CASETON_FACTORS.withCofferedSlab
        : CASETON_FACTORS.solidSlab;

    return baseVolume * factor;
}

// ---------- Pricing tables by type + strength + volume tier ----------

export type VolumeTier = {
    minM3: number;           // inclusive
    maxM3?: number;          // inclusive (if omitted, treated as Infinity)
    pricePerM3Cents: number; // Price in integer cents per m³ (without VAT)
};

type BasePriceTable = Record<
    ConcreteType,
    Record<Strength, VolumeTier[]>
>;

export type PriceTable = {
    base: BasePriceTable;
};

// Convert pesos to integer cents
function pesos(n: number): number {
    return Math.round(n * 100);
}

// Helpers for tier ranges (accept pesos, store cents)
function tier(
    minM3: number,
    unitPricePesos: number,
    maxM3?: number,
): VolumeTier {
    return {
        minM3,
        maxM3,
        pricePerM3Cents: pesos(unitPricePesos),
    };
}

// Prices from your Excel (without VAT)
//
// Tiro directo
//  - Tier 1: 2–2.5 m³
//  - Tier 2: >= 3 m³
//
// Concreto bombeado
//  - Tier 1: 3–4.5 m³
//  - Tier 2: >= 5 m³
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

// ---------- Quote engine ----------

export type QuoteBreakdown = {
    volume: NormalizedVolume;
    strength: Strength;
    concreteType: ConcreteType;
    unitPricePerM3: number; // MXN without VAT (formatted from cents)
    subtotal: number; // MXN without VAT
    vat: number; // MXN (8%)
    total: number; // MXN with VAT
};

export const EMPTY_QUOTE: QuoteBreakdown = {
    volume: {
        requestedM3: 0,
        roundedM3: 0,
        minM3ForType: 0,
        billedM3: 0,
        isBelowMinimum: false,
    },
    strength: '200',
    concreteType: 'direct',
    unitPricePerM3: 0,
    subtotal: 0,
    vat: 0,
    total: 0,
};

function resolveUnitPricePerM3Cents(
    billedM3: number,
    strength: Strength,
    type: ConcreteType,
    table: PriceTable = PRICE_TABLE,
): number {
    const tiers = table.base[type][strength];

    for (const t of tiers) {
        const withinMin = billedM3 >= t.minM3;
        const withinMax =
            typeof t.maxM3 === 'number' ? billedM3 <= t.maxM3 : true;

        if (withinMin && withinMax) {
            return t.pricePerM3Cents;
        }
    }

    const lastTier = tiers[tiers.length - 1];
    return lastTier ? lastTier.pricePerM3Cents : 0;
}

function toPesos(cents: number): number {
    return cents / 100;
}

export function calcQuote(
    requestedM3: number,
    strength: Strength,
    type: ConcreteType,
    table: PriceTable = PRICE_TABLE,
): QuoteBreakdown {
    const volume = normalizeVolume(requestedM3, type);

    if (volume.billedM3 <= 0) {
        return {
            ...EMPTY_QUOTE,
            volume,
            strength,
            concreteType: type,
        };
    }

    const unitCents = resolveUnitPricePerM3Cents(
        volume.billedM3,
        strength,
        type,
        table,
    );

    // All monetary math in integer cents
    const subtotalCents = Math.round(volume.billedM3 * unitCents);
    const vatCents = Math.round(subtotalCents * VAT_RATE);
    const totalCents = subtotalCents + vatCents;

    return {
        volume,
        strength,
        concreteType: type,
        unitPricePerM3: toPesos(unitCents),
        subtotal: toPesos(subtotalCents),
        vat: toPesos(vatCents),
        total: toPesos(totalCents),
    };
}

// lib/pricing.ts

import {
    CASETON_FACTORS,
    M3_STEP,
    MIN_M3_BY_TYPE,
    PRICE_TABLE,
    VAT_RATE
} from "@/config/business";
import type {
    ConcreteType,
    NormalizedVolume,
    PriceTable,
    QuoteBreakdown,
    Strength
} from "@/components/Calculator/types";

// Re-export empty quote for initial usage
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

// ---------- Volume helpers ----------

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

// ---------- Quote engine ----------

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

    // All monetary calculations in integer cents
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

// lib/pricing.ts

import {
    M3_STEP,
    MIN_M3_BY_TYPE,
    PRICE_TABLE,
    VAT_RATE,
    COFFERED_SPECS,
    CASETON_FACTORS
} from "@/config/business";
import type {
    ConcreteType,
    NormalizedVolume,
    PriceTable,
    QuoteBreakdown,
    Strength,
    CofferedSize
} from "@/components/Calculator/types";

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

    const billedM3 = roundedM3 > 0
        ? Math.max(roundedM3, minM3ForType)
        : 0;

    const isBelowMinimum = safeRequested > 0 && safeRequested < minM3ForType;

    return {
        requestedM3: safeRequested,
        roundedM3,
        minM3ForType,
        billedM3,
        isBelowMinimum,
    };
}

// ---------- Volume calculators ----------

export type SlabInputBase = {
    hasCofferedSlab: boolean;
    cofferedSize: CofferedSize | null;
    manualThicknessCm?: number; // Used only if solid slab
};

export type SlabDimensionsInput = SlabInputBase & {
    lengthM: number;
    widthM: number;
};

export type SlabAreaInput = SlabInputBase & {
    areaM2: number;
};

/**
 * Calculates concrete volume based on area.
 * Logic:
 * - If Coffered: Use standardized coefficient (m3/m2).
 * - If Solid: Use geometric volume (Area * Thickness).
 */
export function calcVolumeFromArea(input: SlabAreaInput): number {
    const { areaM2, hasCofferedSlab, cofferedSize, manualThicknessCm } = input;

    if (areaM2 <= 0) return 0;

    // Lógica 1: Losa Aligerada (Usa coeficientes)
    if (hasCofferedSlab && cofferedSize) {
        const spec = COFFERED_SPECS[cofferedSize];
        if (spec) {
            return areaM2 * spec.coefficient;
        }
    }

    // Lógica 2: Losa Sólida (Usa grosor manual)
    const thicknessCm = manualThicknessCm ?? 0;
    if (thicknessCm <= 0) return 0;

    const thicknessM = thicknessCm / 100;
    // Apply solid slab factor (e.g. 0.98 for minor adjustments/waste logic, or 1.0)
    return areaM2 * thicknessM * CASETON_FACTORS.solidSlab;
}

/**
 * Calculates concrete volume based on dimensions (Length x Width).
 * Wraps calcVolumeFromArea internally.
 */
export function calcVolumeFromDimensions(input: SlabDimensionsInput): number {
    const { lengthM, widthM, ...rest } = input;
    const areaM2 = lengthM * widthM;
    return calcVolumeFromArea({ areaM2, ...rest });
}

// --- Quote Engine ---

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

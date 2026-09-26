// lib/pricing.ts

import {
    M3_STEP,
    MIN_M3_BY_TYPE,
    MIN_M3_OVERRIDES,
    PRICE_TABLE,
    VAT_RATE,
    COFFERED_SPECS,
    CASETON_FACTORS
} from "@/config/business";
import type {
    ConcreteType,
    ConcreteOption,
    NormalizedVolume,
    PriceTable,
    QuoteBreakdown,
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
    hasFiber: false,
    unitPricePerM3: 0,
    fiberSubtotal: 0,
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
    strength: ConcreteOption,
): NormalizedVolume {
    const safeRequested = Number.isFinite(requestedM3)
        ? Math.max(requestedM3, 0)
        : 0;

    const minM3 = type === 'direct'
        ? MIN_M3_OVERRIDES[strength] ?? MIN_M3_BY_TYPE[type]
        : MIN_M3_BY_TYPE[type];
    const roundedM3 = roundUpToStep(safeRequested, M3_STEP);

    const billedM3 = roundedM3 > 0
        ? Math.max(roundedM3, minM3)
        : 0;

    const isBelowMinimum = safeRequested > 0 && safeRequested < minM3;

    return {
        requestedM3: safeRequested,
        roundedM3,
        minM3ForType: minM3,
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

    if (!Number.isFinite(areaM2) || areaM2 <= 0) return 0;

    // Lógica 1: Losa Aligerada (Usa coeficientes)
    if (hasCofferedSlab) {
        const spec = cofferedSize ? COFFERED_SPECS[cofferedSize] : undefined;
        return spec ? areaM2 * spec.coefficient : 0;
    }

    // Lógica 2: Losa Sólida (Usa grosor manual)
    const thicknessCm = manualThicknessCm ?? 0;
    if (!Number.isFinite(thicknessCm) || thicknessCm <= 0) return 0;

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
    if (!Number.isFinite(lengthM) || !Number.isFinite(widthM) || lengthM <= 0 || widthM <= 0) {
        return 0;
    }
    const areaM2 = lengthM * widthM;
    return calcVolumeFromArea({ areaM2, ...rest });
}

// --- Quote Engine ---

function resolveUnitPricePerM3Cents(
    billedM3: number,
    strength: ConcreteOption,
    type: ConcreteType,
    table: PriceTable = PRICE_TABLE,
): number {
    const tiers = table.base[type][strength];

    if (!tiers || tiers.length === 0) {
        console.warn(`[Pricing System]: Configuración no encontrada para ${type}/${strength}`);
        return 0;
    }

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
    strength: ConcreteOption,
    type: ConcreteType,
    table: PriceTable = PRICE_TABLE,
    options: { hasFiber?: boolean } = {},
): QuoteBreakdown {
    const { hasFiber = false } = options;
    const volume = normalizeVolume(requestedM3, type, strength);

    if (volume.billedM3 <= 0) {
        return {
            ...EMPTY_QUOTE,
            volume,
            strength,
            concreteType: type,
            hasFiber: false,
        };
    }

    const baseUnitCents = resolveUnitPricePerM3Cents(
        volume.billedM3,
        strength,
        type,
        table,
    );

    const fiberUnitCents = hasFiber
        ? table.extras?.fibra_poly ?? 0
        : 0;

    if (baseUnitCents <= 0 || (hasFiber && fiberUnitCents <= 0)) {
        return {
            ...EMPTY_QUOTE,
            volume,
            strength,
            concreteType: type,
        };
    }

    // PriceTable stores gross rates; expose a net unit price and split the gross total for display.
    const fiberTotalCents = Math.round(volume.billedM3 * fiberUnitCents);
    const totalCents = Math.round(volume.billedM3 * (baseUnitCents + fiberUnitCents));
    const subtotalCents = Math.round(totalCents / (1 + VAT_RATE));
    const vatCents = totalCents - subtotalCents;
    const fiberSubtotalCents = hasFiber
        ? Math.round(fiberTotalCents / (1 + VAT_RATE))
        : 0;

    return {
        volume,
        strength,
        concreteType: type,
        hasFiber,
        unitPricePerM3: toPesos(Math.round(baseUnitCents / (1 + VAT_RATE))),
        fiberSubtotal: toPesos(fiberSubtotalCents),
        subtotal: toPesos(subtotalCents),
        vat: toPesos(vatCents),
        total: toPesos(totalCents),
    };
}

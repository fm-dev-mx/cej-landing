// lib/pricing.ts
import {
    M3_STEP,
    CASETON_FACTORS,
    COFFERED_SPECS,
    FALLBACK_PRICING_RULES // Now consuming the validated fallback
} from "@/config/business";
import type {
    ConcreteType,
    NormalizedVolume,
    QuoteBreakdown,
    Strength,
    CofferedSize,
    CalculatorState,
    QuoteLineItem
} from "@/types/domain";
import type { PricingRules } from "@/lib/schemas/pricing";

// Re-export default rules for consumers (Fail-Open Pattern)
export const DEFAULT_PRICING_RULES: PricingRules = FALLBACK_PRICING_RULES;

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
    baseSubtotal: 0,
    additivesSubtotal: 0,
    subtotal: 0,
    vat: 0,
    total: 0,
    breakdownLines: []
};

// --- Math Utilities ---

export function roundUpToStep(value: number, step: number): number {
    if (!Number.isFinite(value) || value <= 0) return 0;
    const scale = 1 / step;
    return Math.ceil(value * scale - 1e-9) / scale;
}

export function toPesos(cents: number): number {
    return cents / 100;
}

// --- Logic Core ---

export function normalizeVolume(
    requestedM3: number,
    type: ConcreteType,
    rules: PricingRules
): NormalizedVolume {
    const safeRequested = Number.isFinite(requestedM3) ? Math.max(requestedM3, 0) : 0;
    const minM3ForType = rules.minOrderQuantity[type] ?? 0;

    const roundedM3 = roundUpToStep(safeRequested, M3_STEP);
    const billedM3 = roundedM3 > 0 ? Math.max(roundedM3, minM3ForType) : 0;
    const isBelowMinimum = safeRequested > 0 && safeRequested < minM3ForType;

    return {
        requestedM3: safeRequested,
        roundedM3,
        minM3ForType,
        billedM3,
        isBelowMinimum,
    };
}

// Volume Calculators (Geometric)
export type SlabInputBase = {
    hasCofferedSlab: boolean;
    cofferedSize: CofferedSize | null;
    manualThicknessCm?: number;
};

export type SlabDimensionsInput = SlabInputBase & {
    lengthM: number;
    widthM: number;
};

export type SlabAreaInput = SlabInputBase & { areaM2: number; };

export function calcVolumeFromArea(input: SlabAreaInput): number {
    const { areaM2, hasCofferedSlab, cofferedSize, manualThicknessCm } = input;
    if (areaM2 <= 0) return 0;

    if (hasCofferedSlab && cofferedSize) {
        const spec = COFFERED_SPECS[cofferedSize];
        return spec ? areaM2 * spec.coefficient : 0;
    }

    const thicknessCm = manualThicknessCm ?? 0;
    if (thicknessCm <= 0) return 0;
    return areaM2 * (thicknessCm / 100) * CASETON_FACTORS.solidSlab;
}

export function calcVolumeFromDimensions(input: SlabDimensionsInput): number {
    const { lengthM, widthM, ...rest } = input;
    return calcVolumeFromArea({ areaM2: lengthM * widthM, ...rest });
}

// --- Quote Engine (Injected) ---

function resolveBasePriceCents(
    billedM3: number,
    strength: Strength,
    type: ConcreteType,
    rules: PricingRules
): number {
    const tiers = rules.base[type]?.[strength];
    if (!tiers) return 0;

    for (const t of tiers) {
        const withinMin = billedM3 >= t.minM3;
        const withinMax = typeof t.maxM3 === 'number' ? billedM3 <= t.maxM3 : true;
        if (withinMin && withinMax) return t.pricePerM3Cents;
    }

    // Fallback to last tier (highest volume typically)
    return tiers[tiers.length - 1]?.pricePerM3Cents ?? 0;
}

export function calcQuote(
    inputVolume: number,
    inputState: Pick<CalculatorState, 'strength' | 'type' | 'additives'>,
    pricingRules: PricingRules = DEFAULT_PRICING_RULES
): QuoteBreakdown {
    const { strength, type, additives } = inputState;
    const volume = normalizeVolume(inputVolume, type, pricingRules);

    if (volume.billedM3 <= 0) {
        return { ...EMPTY_QUOTE, volume, strength, concreteType: type };
    }

    // 1. Base Price Calculation
    const unitCents = resolveBasePriceCents(volume.billedM3, strength, type, pricingRules);
    const baseSubtotalCents = Math.round(volume.billedM3 * unitCents);

    // 2. Additives Calculation
    let additivesSubtotalCents = 0;
    const breakdownLines: QuoteLineItem[] = [];

    // Base Line
    breakdownLines.push({
        label: `Concreto ${type === 'pumped' ? 'Bomba' : 'Directo'} f'c ${strength}`,
        value: toPesos(baseSubtotalCents),
        type: 'base'
    });

    if (additives && additives.length > 0) {
        additives.forEach(id => {
            const addon = pricingRules.additives.find(a => a.id === id && a.active);
            if (addon) {
                let cost = 0;
                if (addon.pricingModel === 'per_m3') {
                    cost = Math.round(addon.priceCents * volume.billedM3);
                } else {
                    cost = addon.priceCents; // Fixed price per load/service
                }

                additivesSubtotalCents += cost;
                breakdownLines.push({
                    label: addon.label,
                    value: toPesos(cost),
                    type: 'additive'
                });
            }
        });
    }

    // 3. Totals
    const subtotalCents = baseSubtotalCents + additivesSubtotalCents;
    const vatCents = Math.round(subtotalCents * pricingRules.vatRate);
    const totalCents = subtotalCents + vatCents;

    return {
        volume,
        strength,
        concreteType: type,
        unitPricePerM3: toPesos(unitCents),
        baseSubtotal: toPesos(baseSubtotalCents),
        additivesSubtotal: toPesos(additivesSubtotalCents),
        subtotal: toPesos(subtotalCents),
        vat: toPesos(vatCents),
        total: toPesos(totalCents),
        breakdownLines
    };
}

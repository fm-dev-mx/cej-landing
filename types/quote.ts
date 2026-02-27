import { z } from 'zod';
import {
    ConcreteTypeEnum,
    StrengthEnum,
    type PricingRules,
    type VolumeTier
} from '@/lib/schemas/pricing';

export type Strength = z.infer<typeof StrengthEnum>;
export type ConcreteType = z.infer<typeof ConcreteTypeEnum>;

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

export type PricingSnapshot = {
    rules_version: number;
    timestamp: number;
    rules_applied: PricingRules;
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
    pricingSnapshot?: PricingSnapshot;
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

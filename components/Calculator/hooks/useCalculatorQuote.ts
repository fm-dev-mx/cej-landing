// components/Calculator/hooks/useCalculatorQuote.ts

import { useEffect, useMemo } from 'react';
import {
    calcQuote,
    calcVolumeFromArea,
    calcVolumeFromDimensions,
    EMPTY_QUOTE
} from '@/lib/pricing';
import { CONCRETE_TYPES } from '@/config/business';
import { fmtMXN } from '@/lib/utils';
import { trackViewContent } from '@/lib/pixel';
import {
    createKnownVolumeSchema,
    DimensionsSchema,
    AreaSchema
} from '@/lib/schemas';
import {
    type AssistVolumeMode,
    type CalculatorMode,
    type ConcreteType,
    type QuoteBreakdown,
    type Strength,
} from '../types';

type QuoteInput = {
    mode: CalculatorMode | null;
    m3: string;
    volumeMode: AssistVolumeMode;
    length: string;
    width: string;
    thicknessByDims: string;
    area: string;
    thicknessByArea: string;
    hasCoffered: 'yes' | 'no';
    strength: Strength;
    type: ConcreteType;
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

export type QuoteState = {
    quote: QuoteBreakdown;
    requestedM3: number;
    billedM3: number;
    volumeError: string | null;
    volumeWarning: QuoteWarning;
    canProceedToSummary: boolean;
    unitPriceLabel: string;
    modeLabel: string;
};

export function useCalculatorQuote(input: QuoteInput): QuoteState {
    const {
        mode,
        m3,
        volumeMode,
        length,
        width,
        thicknessByDims,
        area,
        thicknessByArea,
        hasCoffered,
        strength,
        type,
    } = input;

    const core = useMemo(() => {
        const empty = {
            quote: EMPTY_QUOTE,
            requestedM3: 0,
            billedM3: 0,
            volumeError: '' as string | null,
            volumeWarning: null as QuoteWarning,
        };

        if (mode === null) {
            return { ...empty, volumeError: null, volumeWarning: null };
        }

        let rawRequested = 0;
        let error: string | null = null;

        // 1. Validate & Parse Input using Zod Schemas
        if (mode === 'knownM3') {
            const schema = createKnownVolumeSchema();
            const result = schema.safeParse({ m3 });

            if (!result.success) {
                // Use the first validation error message
                error = result.error.issues[0].message;
            } else {
                rawRequested = result.data.m3;
            }
        } else {
            const hasCofferedSlab = hasCoffered === 'yes';

            if (volumeMode === 'dimensions') {
                const result = DimensionsSchema.safeParse({
                    length,
                    width,
                    thickness: thicknessByDims,
                });

                if (!result.success) {
                    // If fields are empty/zero, we just show a generic prompt or the specific Zod error
                    // For better UX, if simply empty, we might wait. But here we map Zod errors directly.
                    // To avoid spamming errors on empty initial state, we can check if strings are empty manually
                    // or just let Zod handle "min" messages.
                    const firstIssue = result.error.issues[0];
                    // Only show error if value is present but invalid, OR if we want strict guidance.
                    // For this MVP, we return the error to block progress.
                    if (length || width || thicknessByDims) {
                        error = firstIssue.message;
                    } else {
                        error = 'Completa las medidas para calcular.';
                    }
                } else {
                    const { length: l, width: w, thickness: t } = result.data;
                    rawRequested = calcVolumeFromDimensions({
                        lengthM: l,
                        widthM: w,
                        thicknessCm: t,
                        hasCofferedSlab,
                    });
                }
            } else {
                const result = AreaSchema.safeParse({
                    area,
                    thickness: thicknessByArea,
                });

                if (!result.success) {
                    const firstIssue = result.error.issues[0];
                    if (area || thicknessByArea) {
                        error = firstIssue.message;
                    } else {
                        error = 'Completa área y grosor para calcular.';
                    }
                } else {
                    const { area: a, thickness: t } = result.data;
                    rawRequested = calcVolumeFromArea({
                        areaM2: a,
                        thicknessCm: t,
                        hasCofferedSlab,
                    });
                }
            }
        }

        if (error || rawRequested <= 0) {
            return {
                ...empty,
                volumeError: error,
                volumeWarning: null,
            };
        }

        // 2. Calculate Quote (Business Logic)
        const q = calcQuote(rawRequested, strength, type);
        const {
            requestedM3: normalizedRequested,
            billedM3: normalizedBilled,
            minM3ForType,
            roundedM3,
            isBelowMinimum,
        } = q.volume;

        // 3. Determine Warnings
        let warning: QuoteWarning = null;
        const typeLabel = CONCRETE_TYPES.find((t) => t.value === type)?.label ?? type;

        if (isBelowMinimum) {
            warning = {
                code: 'BELOW_MINIMUM',
                minM3: minM3ForType,
                billedM3: normalizedBilled,
                typeLabel,
            };
        } else if (normalizedBilled !== normalizedRequested) {
            warning = {
                code: 'ROUNDING_POLICY',
                requestedM3: normalizedRequested,
                billedM3: normalizedBilled,
            };
        } else if (roundedM3 !== normalizedRequested) {
            warning = {
                code: 'ROUNDING_ADJUSTMENT',
                billedM3: normalizedBilled,
            };
        }

        return {
            quote: q,
            requestedM3: normalizedRequested,
            billedM3: normalizedBilled,
            volumeError: null,
            volumeWarning: warning,
        };
    }, [
        mode,
        m3,
        volumeMode,
        length,
        width,
        thicknessByDims,
        area,
        thicknessByArea,
        hasCoffered,
        strength,
        type,
    ]);

    // Track view content whenever quote total changes
    useEffect(() => {
        if (core.quote.total > 0) {
            trackViewContent(core.quote.total);
        }
    }, [core.quote.total]);

    const canProceedToSummary = !core.volumeError && core.billedM3 > 0;
    const unitPriceLabel = fmtMXN(core.quote.unitPricePerM3);

    const modeLabel =
        mode === 'knownM3'
            ? 'Sí'
            : mode === 'assistM3'
                ? 'No, ayúdame a definirlo'
                : 'Modo sin seleccionar';

    return {
        ...core,
        canProceedToSummary,
        unitPriceLabel,
        modeLabel,
    };
}

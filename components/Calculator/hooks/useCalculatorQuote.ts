// components/Calculator/hooks/useCalculatorQuote.ts

import { useEffect, useMemo } from 'react';
import {
    calcQuote,
    calcVolumeFromArea,
    calcVolumeFromDimensions,
    EMPTY_QUOTE
} from '@/lib/pricing';
import { MIN_M3_BY_TYPE, CONCRETE_TYPES } from '@/config/business';
import { clamp, fmtMXN, parseNum } from '@/lib/utils';
import { trackViewContent } from '@/lib/pixel';
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
            return {
                ...empty,
                volumeError: null,
                volumeWarning: null,
            };
        }

        let rawRequested = 0;
        let error: string | null = null;

        // Get min volume early for initial input validation messages
        const minRequired = MIN_M3_BY_TYPE[type];

        // Resolve human-readable label (e.g., "pumped" -> "Bombeado")
        const typeConfig = CONCRETE_TYPES.find((t) => t.value === type);
        const typeLabel = typeConfig ? typeConfig.label : type;

        if (mode === 'knownM3') {
            const parsed = clamp(parseNum(m3), 0, 500);
            rawRequested = parsed;

            if (!parsed) {
                // Show error if value is zero/invalid
                error = `Ingresa un volumen válido (mínimo sugerido ${minRequired} m³).`;
            }
        } else {
            const hasCofferedSlab = hasCoffered === 'yes';

            if (volumeMode === 'dimensions') {
                const lengthNum = clamp(parseNum(length), 0, 1000);
                const widthNum = clamp(parseNum(width), 0, 1000);
                const thicknessNum = clamp(parseNum(thicknessByDims), 0, 100);

                if (!lengthNum || !widthNum || !thicknessNum) {
                    error =
                        'Completa largo, ancho y grosor para poder calcular los m³.';
                } else {
                    const volume = calcVolumeFromDimensions({
                        lengthM: lengthNum,
                        widthM: widthNum,
                        thicknessCm: thicknessNum,
                        hasCofferedSlab,
                    });

                    rawRequested = volume;

                    if (!volume) {
                        error = 'Verifica que las medidas sean mayores a 0.';
                    }
                }
            } else {
                const areaNum = clamp(parseNum(area), 0, 20000);
                const thicknessNum = clamp(parseNum(thicknessByArea), 0, 100);

                if (!areaNum || !thicknessNum) {
                    error = 'Completa área y grosor para poder calcular los m³.';
                } else {
                    const volume = calcVolumeFromArea({
                        areaM2: areaNum,
                        thicknessCm: thicknessNum,
                        hasCofferedSlab,
                    });

                    rawRequested = volume;

                    if (!volume) {
                        error = 'Verifica que las medidas sean mayores a 0.';
                    }
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

        // If rawRequested > 0, calculate the quote.
        const q = calcQuote(rawRequested, strength, type);
        const {
            requestedM3: normalizedRequested,
            billedM3: normalizedBilled,
            minM3ForType,
            roundedM3,
            isBelowMinimum,
        } = q.volume;

        let warning: QuoteWarning = null;

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

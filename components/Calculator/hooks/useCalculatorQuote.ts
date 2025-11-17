// components/Calculator/hooks/useCalculatorQuote.ts

import { useEffect, useMemo } from 'react';
import {
    calcQuote,
    calcVolumeFromArea,
    calcVolumeFromDimensions,
    EMPTY_QUOTE,
} from '@/lib/pricing';
import { clamp, fmtMXN, parseNum } from '@/lib/utils';
import { trackViewContent } from '@/lib/pixel';
import type {
    AssistVolumeMode,
    CalculatorMode,
    ConcreteType,
    QuoteBreakdown,
    Strength,
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

export type QuoteState = {
    quote: QuoteBreakdown;
    requestedM3: number;
    billedM3: number;
    volumeError: string | null;
    volumeWarning: string | null;
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
            volumeWarning: '' as string | null,
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

        if (mode === 'knownM3') {
            const parsed = clamp(parseNum(m3), 0, 500);
            rawRequested = parsed;

            if (!parsed) {
                error = 'Ingresa un volumen mayor a 0 m³.';
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

        const q = calcQuote(rawRequested, strength, type);
        const {
            requestedM3: normalizedRequested,
            billedM3: normalizedBilled,
            minM3ForType,
            roundedM3,
            isBelowMinimum,
        } = q.volume;

        let warning: string | null = null;

        if (isBelowMinimum) {
            warning = `El mínimo para este tipo de concreto es ${minM3ForType.toFixed(
                1,
            )} m³. La cotización se calcula sobre ${normalizedBilled.toFixed(
                1,
            )} m³.`;
        } else if (normalizedBilled !== normalizedRequested) {
            warning =
                `Por política, el volumen se redondea hacia arriba a múltiplos de 0.5 m³. ` +
                `Ingresaste aproximadamente ${normalizedRequested.toFixed(
                    2,
                )} m³ y se está cotizando sobre ${normalizedBilled.toFixed(2)} m³.`;
        } else if (roundedM3 !== normalizedRequested) {
            warning =
                `El volumen se ajusta a múltiples de 0.5 m³. Se está cotizando sobre ${normalizedBilled.toFixed(
                    2,
                )} m³.`;
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

    const canProceedToSummary =
        !core.volumeError && core.billedM3 > 0;

    const unitPriceLabel = fmtMXN(core.quote.unitPricePerM3);

    const modeLabel =
        mode === 'knownM3'
            ? 'Ya sé cuántos m³ necesito'
            : mode === 'assistM3'
                ? 'Ayúdame a calcular los m³'
                : 'Modo sin seleccionar';

    return {
        ...core,
        canProceedToSummary,
        unitPriceLabel,
        modeLabel,
    };
}

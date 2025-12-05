// components/Calculator/hooks/useCalculatorQuote.ts

import { useEffect, useMemo } from 'react';
import {
    calcQuote,
    calcVolumeFromArea,
    calcVolumeFromDimensions,
    EMPTY_QUOTE
} from '@/lib/pricing';
import {
    CONCRETE_TYPES,
    COFFERED_SPECS,
    CASETON_FACTORS
} from '@/config/business';
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
    type CofferedSize,
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
    cofferedSize: CofferedSize | null;
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
        cofferedSize,
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
        let calculationMetadata: QuoteBreakdown['calculationDetails'];

        // 1. Validate & Parse Input using Zod Schemas
        if (mode === 'knownM3') {
            const schema = createKnownVolumeSchema();
            const result = schema.safeParse({ m3 });

            if (!result.success) {
                error = result.error.issues[0].message;
            } else {
                rawRequested = result.data.m3;
                calculationMetadata = { formula: 'Volumen conocido' };
            }
        } else {
            const hasCofferedSlab = hasCoffered === 'yes';
            // 1. Obtener especificaciones si es aligerada
            let effectiveThicknessCm = 0;
            let coefficient = 0;

            if (hasCofferedSlab && cofferedSize && COFFERED_SPECS[cofferedSize]) {
                effectiveThicknessCm = COFFERED_SPECS[cofferedSize].totalThicknessCm;
                coefficient = COFFERED_SPECS[cofferedSize].coefficient;
            }

            // 2. Definir valor de respaldo (Dummy) para Zod
            // Usamos el grosor de la losa de 7cm (12cm total) como base segura
            const defaultDummyThickness = String(COFFERED_SPECS['7'].totalThicknessCm);

            if (volumeMode === 'dimensions') {
                // Inyectar valor dummy si es aligerada
                const inputThickness = hasCofferedSlab
                    ? (effectiveThicknessCm > 0 ? String(effectiveThicknessCm) : defaultDummyThickness)
                    : thicknessByDims;

                const result = DimensionsSchema.safeParse({
                    length,
                    width,
                    thickness: inputThickness,
                });

                if (!result.success) {
                    if (length || width || inputThickness) {
                        error = result.error.issues[0].message;
                    } else {
                        error = 'Completa las medidas para calcular.';
                    }
                } else {
                    const { length: l, width: w, thickness: t } = result.data;

                    rawRequested = calcVolumeFromDimensions({
                        lengthM: l,
                        widthM: w,
                        manualThicknessCm: hasCofferedSlab ? 0 : t,
                        hasCofferedSlab,
                        cofferedSize
                    });

                    // Metadata para mostrar al usuario
                    const areaM2 = l * w;
                    if (hasCofferedSlab) {
                        calculationMetadata = {
                            formula: `${areaM2.toFixed(2)} m² × ${coefficient.toFixed(3)} (Coeficiente)`,
                            factorUsed: coefficient,
                            effectiveThickness: effectiveThicknessCm
                        };
                    } else {
                        const tM = t / 100;
                        calculationMetadata = {
                            formula: `${areaM2.toFixed(2)} m² × ${tM.toFixed(2)} m (Grosor)`,
                            factorUsed: CASETON_FACTORS.solidSlab,
                            effectiveThickness: t
                        };
                    }
                }
            } else {
                // Modo Área
                const inputThickness = hasCofferedSlab
                    ? (effectiveThicknessCm > 0 ? String(effectiveThicknessCm) : defaultDummyThickness)
                    : thicknessByArea;

                const result = AreaSchema.safeParse({
                    area,
                    thickness: inputThickness,
                });

                if (!result.success) {
                    if (area || inputThickness) {
                        error = result.error.issues[0].message;
                    } else {
                        error = 'Completa área y grosor para calcular.';
                    }
                } else {
                    const { area: a, thickness: t } = result.data;

                    rawRequested = calcVolumeFromArea({
                        areaM2: a,
                        manualThicknessCm: hasCofferedSlab ? 0 : t,
                        hasCofferedSlab,
                        cofferedSize
                    });

                    if (hasCofferedSlab) {
                        calculationMetadata = {
                            formula: `${a.toFixed(2)} m² × ${coefficient.toFixed(3)} (Coeficiente)`,
                            factorUsed: coefficient,
                            effectiveThickness: effectiveThicknessCm
                        };
                    } else {
                        const tM = t / 100;
                        calculationMetadata = {
                            formula: `${a.toFixed(2)} m² × ${tM.toFixed(2)} m (Grosor)`,
                            factorUsed: CASETON_FACTORS.solidSlab,
                            effectiveThickness: t
                        };
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

        // 2. Calculate Quote (Business Logic)
        const q = calcQuote(rawRequested, strength, type);
        q.calculationDetails = calculationMetadata;

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
        cofferedSize,
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

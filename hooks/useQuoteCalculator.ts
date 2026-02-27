// hooks/useQuoteCalculator.ts
// Validates calculator input and produces a quote + warnings.

import { useMemo } from "react";

import {
    calcQuote,
    calcVolumeFromDimensions,
    calcVolumeFromArea,
    EMPTY_QUOTE,
} from "@/lib/pricing";
import {
    COFFERED_SPECS,
    CASETON_FACTORS,
    CONCRETE_TYPES,
} from "@/config/business";
import {
    createKnownVolumeSchema,
    DimensionsSchema,
    AreaSchema,
} from "@/lib/schemas";
import { type PricingRules } from "@/lib/schemas/pricing";

import type {
    CalculatorState,
    QuoteBreakdown,
    QuoteWarning,
} from "@/types/domain";

export interface QuoteCalculatorResult {
    quote: QuoteBreakdown;
    rawVolume: number;
    billedM3: number;
    isValid: boolean;
    error: string | null;
    warning: QuoteWarning;
}

export function useQuoteCalculator(
    input: CalculatorState,
    overriddenRules?: PricingRules
): QuoteCalculatorResult {
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
        additives,
    } = input;

    const result = useMemo(() => {
        const emptyResult = {
            quote: EMPTY_QUOTE,
            rawVolume: 0,
            billedM3: 0,
            isValid: false,
            error: null as string | null,
            warning: null as QuoteWarning,
        };

        if (mode === null) return emptyResult;

        let rawRequested = 0;
        let error: string | null = null;
        let calculationDetails: QuoteBreakdown["calculationDetails"];

        // MODE 1: Direct known volume
        if (mode === "knownM3") {
            const schema = createKnownVolumeSchema();
            const parse = schema.safeParse({ m3 });

            if (!parse.success) {
                error = parse.error.issues[0]?.message ?? "Volumen inválido.";
            } else {
                rawRequested = parse.data.m3;
                calculationDetails = {
                    formula: "Volumen ingresado manualmente",
                };
            }
        } else {
            // MODE 2: Assisted volume (dimensions/area)
            const hasCofferedSlab = hasCoffered === "yes";
            let coefficient = 0;

            if (
                hasCofferedSlab &&
                cofferedSize &&
                COFFERED_SPECS[cofferedSize]
            ) {
                coefficient = COFFERED_SPECS[cofferedSize].coefficient;
            }

            // We now validate thickness even for coffered slabs (compression layer)
            if (volumeMode === "dimensions") {
                const parse = DimensionsSchema.safeParse({
                    length,
                    width,
                    thickness: thicknessByDims,
                });

                if (!parse.success) {
                    if (length || width || thicknessByDims) {
                        error =
                            parse.error.issues[0]?.message ??
                            "Medidas inválidas.";
                    } else {
                        error = "Ingresa las medidas.";
                    }
                } else {
                    const { length: l, width: w, thickness: t } = parse.data;

                    rawRequested = calcVolumeFromDimensions({
                        lengthM: l,
                        widthM: w,
                        manualThicknessCm: t,
                        hasCofferedSlab,
                        cofferedSize,
                    });

                    const areaM2 = l * w;

                    if (hasCofferedSlab) {
                        // Formula: Area * (Ribs + Compression)
                        // Verify pricing logic handles this override
                        calculationDetails = {
                            formula: `${areaM2.toFixed(
                                2
                            )} m² (Losa Aligerada)`,
                            factorUsed: coefficient,
                        };
                    } else {
                        const tM = t / 100;
                        calculationDetails = {
                            formula: `${areaM2.toFixed(
                                2
                            )} m² × ${tM.toFixed(2)} m`,
                            factorUsed: CASETON_FACTORS.solidSlab,
                        };
                    }
                }
            } else {
                // volumeMode === 'area'
                const parse = AreaSchema.safeParse({
                    area,
                    thickness: thicknessByArea,
                });

                if (!parse.success) {
                    error =
                        parse.error.issues[0]?.message ?? "Área inválida.";
                } else {
                    const { area: a, thickness: t } = parse.data;

                    // Compute volume from area and apply coffered logic if needed
                    rawRequested = calcVolumeFromArea({
                        areaM2: a,
                        manualThicknessCm: t,
                        hasCofferedSlab,
                        cofferedSize,
                    });

                    if (hasCofferedSlab) {
                        calculationDetails = {
                            formula: `${a.toFixed(
                                2
                            )} m² × ${coefficient} (Coef. Aporte)`,
                            factorUsed: coefficient,
                        };
                    } else {
                        const tM = t / 100;
                        calculationDetails = {
                            formula: `${a.toFixed(2)} m² × ${tM.toFixed(2)} m`,
                            factorUsed: CASETON_FACTORS.solidSlab,
                        };
                    }
                }
            }
        }

        // If any validation error or non-positive volume, fail fast
        if (error || rawRequested <= 0) {
            return { ...emptyResult, error };
        }

        // Validate Strength/Type selection (null check)
        if (!strength || !type) {
            return { ...emptyResult, rawVolume: rawRequested, billedM3: rawRequested, error: "Selecciona resistencia y servicio." };
        }

        // Compute quote using engine
        const quote = calcQuote(rawRequested, {
            strength,
            type,
            additives: additives || [],
        }, overriddenRules);

        quote.calculationDetails = calculationDetails;

        const {
            requestedM3: normReq,
            billedM3: normBill,
            minM3ForType,
            roundedM3,
            isBelowMinimum,
        } = quote.volume;

        let warning: QuoteWarning = null;
        const typeLabel =
            CONCRETE_TYPES.find((t) => t.value === type)?.label ?? type ?? "Concreto";

        if (isBelowMinimum) {
            warning = {
                code: "BELOW_MINIMUM",
                minM3: minM3ForType,
                billedM3: normBill,
                typeLabel,
            };
        } else if (normBill !== normReq) {
            warning = {
                code: "ROUNDING_POLICY",
                requestedM3: normReq,
                billedM3: normBill,
            };
        } else if (roundedM3 !== normReq) {
            warning = {
                code: "ROUNDING_ADJUSTMENT",
                billedM3: normBill,
            };
        }

        return {
            quote,
            rawVolume: rawRequested,
            billedM3: normBill,
            isValid: true,
            error: null,
            warning,
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
        additives,
        overriddenRules,
    ]);

    return result;
}

// components/Calculator/CalculatorForm.tsx
// Main calculator orchestrator wiring store state to form steps and summary.

"use client";

import { useEffect, useRef } from "react";

import { useCejStore } from "@/store/useCejStore";
import { useQuoteCalculator } from "@/hooks/useQuoteCalculator";

import { ModeSelector } from "./steps/ModeSelector";
import { Step5Summary } from "./steps/Step5Summary";

import { KnownVolumeForm } from "./Forms/KnownVolumeForm";
import { WorkTypeSelector } from "./Forms/WorkTypeSelector";
import { AssistVolumeForm } from "./Forms/AssistVolumeForm";
import { SpecsForm } from "./Forms/SpecsForm";
import { AdditivesForm } from "./Forms/AdditivesForm";

import styles from "./CalculatorForm.module.scss";

/**
 * CalculatorForm
 *
 * - Connects the Zustand store draft to individual form sections.
 * - Manages focus when mode changes.
 * - Shows validation errors, warnings and summary (ticket-style).
 */
export function CalculatorForm() {
    const draft = useCejStore((s) => s.draft);

    // Quote engine result
    const { error, warning } = useQuoteCalculator(draft);

    // Focus management
    const inputsSectionRef = useRef<HTMLDivElement>(null);
    const specsSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (draft.mode && inputsSectionRef.current) {
            const firstInput =
                inputsSectionRef.current.querySelector("input, select");
            if (firstInput instanceof HTMLElement) {
                firstInput.focus();
            }
        }
    }, [draft.mode]);

    return (
        <div className={styles.container}>
            {/* 1. Mode selection */}
            <div className={styles.field}>
                <label className={styles.label}>¿Cómo quieres cotizar?</label>
                <ModeSelector currentMode={draft.mode} />
            </div>

            {/* 2. Volume inputs */}
            <div ref={inputsSectionRef}>
                {draft.mode === "knownM3" ? (
                    <div className={styles.field}>
                        <KnownVolumeForm hasError={!!error} />
                    </div>
                ) : (
                    <>
                        <div className={styles.field}>
                            <WorkTypeSelector />
                        </div>

                        {draft.workType && (
                            <div className={styles.field}>
                                <AssistVolumeForm error={error} />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* 3. Specs & additives (expert section) */}
            {(draft.mode === "knownM3" || draft.workType) && (
                <div
                    className={styles.fieldWithSeparator}
                    ref={specsSectionRef}
                >
                    <SpecsForm />

                    {draft.showExpertOptions && (
                        <div className={styles.animateFadeIn}>
                            <AdditivesForm />
                        </div>
                    )}
                </div>
            )}

            {/* 4. Feedback & warnings */}
            {error && (
                <div className={styles.error} role="alert">
                    {error}
                </div>
            )}

            {!error && warning && (
                <div className={styles.note}>
                    {warning.code === "BELOW_MINIMUM" && (
                        <span>
                            Nota: El pedido mínimo es {warning.minM3} m³. Se
                            ajustará el precio.
                        </span>
                    )}

                    {warning.code === "ROUNDING_POLICY" && (
                        <span>
                            El volumen se ajusta a múltiplos de 0.5 m³.
                        </span>
                    )}
                </div>
            )}

            {/* 5. Summary (ticket-like view) */}
            <div className={styles.summarySection}>
                <Step5Summary />
            </div>
        </div>
    );
}

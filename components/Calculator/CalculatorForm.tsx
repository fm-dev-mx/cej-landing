// components/Calculator/CalculatorForm.tsx
// Main calculator orchestrator wiring store state to form steps and summary.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useCejStore } from "@/store/useCejStore";
import { useQuoteCalculator } from "@/hooks/useQuoteCalculator";

import { ModeSelector } from "./ModeSelector";
import { QuoteSummary } from "./QuoteSummary";

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

    // Track if user has interacted with any field (hybrid validation)
    const [hasTouchedAnyField, setHasTouchedAnyField] = useState(false);

    // Callback for child forms to notify when a field is touched
    const handleFieldTouched = useCallback(() => {
        setHasTouchedAnyField(true);
    }, []);

    // Reset touched state when mode changes
    useEffect(() => {
        setHasTouchedAnyField(false);
    }, [draft.mode]);

    // Focus management
    const inputsSectionRef = useRef<HTMLDivElement>(null);
    const specsSectionRef = useRef<HTMLDivElement>(null);
    const formContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (draft.mode && inputsSectionRef.current) {
            const firstInput =
                inputsSectionRef.current.querySelector("input, select");
            if (firstInput instanceof HTMLElement) {
                firstInput.focus();
            }
        }
    }, [draft.mode]);

    const assistVolumeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (draft.workType && assistVolumeRef.current) {
            // Tiny timeout to ensure DOM render before scroll/focus
            setTimeout(() => {
                assistVolumeRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
                // Optional: find first input inside to focus?
                const firstInput = assistVolumeRef.current?.querySelector('input, select');
                if (firstInput instanceof HTMLElement) {
                    firstInput.focus();
                }
            }, 100);
        }
    }, [draft.workType]);

    /**
     * Focus the first invalid input field.
     * Called when user attempts to proceed with validation errors.
     */
    const focusFirstInvalidInput = useCallback(() => {
        if (!formContainerRef.current) return;

        // Mark all fields as touched to show errors
        setHasTouchedAnyField(true);

        // Find first input with aria-invalid="true" or first empty required input
        const invalidInput = formContainerRef.current.querySelector<HTMLElement>(
            'input[aria-invalid="true"], input:invalid'
        );

        if (invalidInput) {
            invalidInput.scrollIntoView({ behavior: "smooth", block: "center" });
            invalidInput.focus();
        }
    }, []);

    const submittedQuote = useCejStore((s) => s.submittedQuote);

    // If a quote is already submitted, hide the calculator form and only show the summary (ticket)
    if (submittedQuote) {
        return (
            <div className={styles.container} ref={formContainerRef}>
                <div className={styles.summarySection}>
                    <QuoteSummary
                        hasError={false}
                        onFocusError={focusFirstInvalidInput}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container} ref={formContainerRef}>
            {/* 1. Mode selection */}
            <div className={styles.field}>
                <label className={styles.label}>¿Cómo quieres cotizar?</label>
                <ModeSelector currentMode={draft.mode} />
            </div>

            {/* 2. Volume inputs */}
            <div ref={inputsSectionRef}>
                {draft.mode === "knownM3" ? (
                    <div className={styles.field}>
                        <KnownVolumeForm
                            hasError={!!error}
                            onFieldTouched={handleFieldTouched}
                        />
                    </div>
                ) : (
                    <>
                        <div className={styles.field}>
                            <WorkTypeSelector />
                        </div>

                        {draft.workType && (
                            <div className={`${styles.field} ${styles.animateFadeIn}`} ref={assistVolumeRef}>
                                <AssistVolumeForm
                                    error={error}
                                    onFieldTouched={handleFieldTouched}
                                />
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
                    {/* Additives Toggle */}
                    <div className={`${styles.field} ${styles.additivesContainer}`}>
                        <button
                            type="button"
                            onClick={() => useCejStore.getState().setExpertMode(!draft.showExpertOptions)}
                            className={styles.toggleButton}
                        >
                            <span>{draft.showExpertOptions ? "▾ Ocultar Aditivos" : "▸ Agregar Aditivos"}</span>
                        </button>
                    </div>

                    {draft.showExpertOptions && (
                        <div className={styles.animateFadeIn}>
                            <AdditivesForm />
                        </div>
                    )}
                </div>
            )}

            <div className={styles.fieldWithSeparator}></div>

            {/* 4. Feedback & warnings (only after user interaction) */}
            {error && hasTouchedAnyField && (
                <div className={styles.error} role="alert">
                    {error}
                </div>
            )}

            {!error && warning && (
                <div className={styles.note}>
                    {warning.code === "BELOW_MINIMUM" && (
                        <span>
                            {warning.typeLabel?.toLowerCase().includes("bomba")
                                ? `⚠️ El pedido mínimo para concreto bombeado es de 3 m³.`
                                : `⚠️ El pedido mínimo para tiro directo es de 2 m³.`
                            }
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
                <QuoteSummary
                    hasError={!!error}
                    onFocusError={focusFirstInvalidInput}
                />

            </div>
        </div>
    );
}

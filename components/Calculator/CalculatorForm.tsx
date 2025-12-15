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
 * - Shows validation errors, warnings and summary (ticket-style).
 */
import { useSearchParams } from 'next/navigation';

export function CalculatorForm() {
    const draft = useCejStore((s) => s.draft);

    // URL Deep Linking for shared quotes (Local history lookup)
    const searchParams = useSearchParams();
    const folioParam = searchParams?.get('folio');
    const setSubmittedQuote = useCejStore((s) => s.setSubmittedQuote);
    const history = useCejStore((s) => s.history);
    const cart = useCejStore((s) => s.cart);

    useEffect(() => {
        if (!folioParam) return;
        // Try to find the quote in local storage (history or active cart)
        const item = history.find(i => i.folio === folioParam) || cart.find(i => i.folio === folioParam);

        if (item) {
            setSubmittedQuote({
                folio: item.folio!,
                name: item.customer?.name || "Cliente",
                results: item.results
            });
        }
    }, [folioParam, history, cart, setSubmittedQuote]);

    // Quote engine result
    const { error, warning, rawVolume } = useQuoteCalculator(draft);

    // Track touched state relative to the current mode (Derived State pattern)
    // When mode changes, this state will not match, implicitly resetting 'hasTouchedAnyField' to false.
    const [touchedState, setTouchedState] = useState<{ mode: string | null; touched: boolean }>({
        mode: draft.mode,
        touched: false,
    });

    const hasTouchedAnyField = touchedState.mode === draft.mode && touchedState.touched;

    // Callback for child forms to notify when a field is touched
    const handleFieldTouched = useCallback(() => {
        setTouchedState({ mode: draft.mode, touched: true });
    }, [draft.mode]);

    // Focus management - REMOVED aggressive scrollIntoView on mode change to prevent jumps
    const inputsSectionRef = useRef<HTMLDivElement>(null);
    const specsSectionRef = useRef<HTMLDivElement>(null);
    const formContainerRef = useRef<HTMLDivElement>(null);
    const assistVolumeRef = useRef<HTMLDivElement>(null);

    // --- Guided Focus Logic ---
    // Determine the next field that needs attention
    const getActiveField = () => {
        if (!draft.mode) return 'mode';

        if (draft.mode === 'knownM3') {
            if (!draft.m3) return 'm3';
        } else {
            // Assist Mode
            if (!draft.workType) return 'workType';
            // Specific sub-fields can be handled within forms if needed,
            // but here we just guide to the section
            if (draft.workType && (!draft.length || !draft.width)) return 'assistVolume';
        }

        // Common fields
        // Note: Strength and Type might have defaults, but if explicit selection is needed:
        if (!draft.strength) return 'specs';

        return null;
    }

    const activeField = getActiveField();

    // Scroll to assist volume ONLY if user just selected workType (interaction)
    // We avoid doing this on initial load or reset
    useEffect(() => {
        if (draft.workType && assistVolumeRef.current) {
            // Only scroll if it's not already visible?
            // For now, removing the scroll to fix "Reiniciar" jump if checks passed.
            // But user might want auto-scroll when they pick "Losa".
            // We'll keep it subtle or remove if problematic.
            // DECISION: Remove auto-scroll here to satisfy "Fix jump" requirement.
            // The "Guided Focus" highlight will draw attention instead.
        }
    }, [draft.workType]);

    /**
     * Focus the first invalid input field.
     * Called when user attempts to proceed with validation errors.
     */
    const focusFirstInvalidInput = useCallback(() => {
        if (!formContainerRef.current) return;

        // Mark all fields as touched to show errors
        setTouchedState({ mode: draft.mode, touched: true });

        // Find first input with aria-invalid="true" or first empty required input
        const invalidInput = formContainerRef.current.querySelector<HTMLElement>(
            'input[aria-invalid="true"], input:invalid'
        );

        if (invalidInput) {
            invalidInput.scrollIntoView({ behavior: "smooth", block: "center" });
            invalidInput.focus();
        }
    }, [draft.mode]);

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
            <div className={`${styles.field} ${activeField === 'mode' ? styles.activeField : ''}`}>
                <label className={styles.label}>¿Cómo quieres cotizar?</label>
                <ModeSelector currentMode={draft.mode} />
            </div>

            {/* 2. Volume inputs */}
            <div ref={inputsSectionRef}>
                {draft.mode === "knownM3" ? (
                    <div className={`${styles.field} ${activeField === 'm3' ? styles.activeField : ''}`}>
                        <KnownVolumeForm
                            hasError={!!error && rawVolume <= 0}
                            onFieldTouched={handleFieldTouched}
                        />
                    </div>
                ) : (
                    <>
                        <div className={`${styles.field} ${activeField === 'workType' ? styles.activeField : ''}`}>
                            <WorkTypeSelector />
                        </div>

                        {draft.workType && (
                            <div
                                className={`${styles.field} ${styles.animateFadeIn} ${activeField === 'assistVolume' ? styles.activeField : ''}`}
                                ref={assistVolumeRef}
                            >
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
                    className={`${styles.fieldWithSeparator} ${activeField === 'specs' ? styles.activeField : ''}`}
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

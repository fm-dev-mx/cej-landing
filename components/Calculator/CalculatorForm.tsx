// components/Calculator/CalculatorForm.tsx
// Main calculator orchestrator wiring store state to form steps and summary.

"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from 'next/navigation';

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


import { useCalculatorUI } from "@/hooks/useCalculatorUI";

/**
 * CalculatorForm
 *
 * - Connects the Zustand store draft to individual form sections.
 * - Manages focus when mode changes (via useCalculatorUI hook).
 * - Shows validation errors, warnings and summary (ticket-style).
 */
export function CalculatorForm() {
    const draft = useCejStore((s) => s.draft);

    // URL Deep Linking for shared quotes (Local history lookup)
    const searchParams = useSearchParams();
    const folioParam = searchParams?.get('folio');
    const setSubmittedQuote = useCejStore((s) => s.setSubmittedQuote);
    const history = useCejStore((s) => s.history);
    const cart = useCejStore((s) => s.cart);
    const editingItemId = useCejStore((s) => s.editingItemId);
    const cancelEdit = useCejStore((s) => s.cancelEdit);

    useEffect(() => {
        if (!folioParam) return;
        const item = history.find(i => i.folio === folioParam) || cart.find(i => i.folio === folioParam);

        if (item) {
            setSubmittedQuote({
                folio: item.folio!,
                name: item.customer?.name || "Cliente",
                results: item.results
            });
        }
    }, [folioParam, history, cart, setSubmittedQuote]);

    // UI Orchestration hook
    const {
        formContainerRef,
        assistVolumeRef,
        hasTouchedAnyField,
        handleFieldTouched,
        scrollToCalcTop,
        focusFirstInvalidInput,
        activeField
    } = useCalculatorUI(draft);

    // Quote engine result
    const { error, warning, rawVolume } = useQuoteCalculator(draft);

    const submittedQuote = useCejStore((s) => s.submittedQuote);

    // If a quote is already submitted, hide the calculator form and only show the summary (ticket)
    if (submittedQuote) {
        return (
            <div className={styles.container} ref={formContainerRef}>
                <div className={styles.summarySection}>
                    <QuoteSummary
                        hasError={false}
                        onFocusError={focusFirstInvalidInput}
                        onScrollToTop={scrollToCalcTop}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container} ref={formContainerRef}>
            {/* Edit Mode Banner */}
            {editingItemId && (
                <div className={styles.editBanner} role="status">
                    <span className={styles.editBannerIcon}>✏️</span>
                    <span>Editando cálculo — tus cambios reemplazarán el item actual.</span>
                    <button
                        type="button"
                        className={styles.editBannerCancel}
                        onClick={() => {
                            cancelEdit();
                            scrollToCalcTop();
                        }}
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {/* 1. Mode selection */}
            <div className={`${styles.field} ${activeField === 'mode' ? styles.activeField : ''}`}>
                <label className={styles.label}>¿Cómo quieres cotizar?</label>
                <ModeSelector currentMode={draft.mode} />
            </div>

            {/* 2. Volume inputs - Wrapped for smooth height transition */}
            <div className={styles.volumeSection}>
                <div>
                    {draft.mode === "knownM3" ? (
                        <div className={`${styles.field} ${activeField === 'm3' ? styles.activeField : ''}`}>
                            <KnownVolumeForm
                                hasError={!!error && rawVolume <= 0}
                                forceValidation={hasTouchedAnyField}
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
                                        forceValidation={hasTouchedAnyField}
                                        onFieldTouched={handleFieldTouched}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* 3. Specs & additives (expert section) */}
            {(draft.mode === "knownM3" || draft.workType) && (
                <div
                    className={`${styles.fieldWithSeparator} ${activeField === 'specs' ? styles.activeField : ''}`}
                >
                    <SpecsForm />
                    {/* Additives Toggle */}
                    <div className={`${styles.field} ${styles.additivesContainer}`}>
                        <label className={`${styles.toggleButton} ${draft.showExpertOptions ? styles.active : ''}`}>
                            <input
                                type="checkbox"
                                checked={draft.showExpertOptions}
                                onChange={() => useCejStore.getState().setExpertMode(!draft.showExpertOptions)}
                                className={styles.toggleInput}
                            />
                            <span className={styles.toggleFakeCheckbox} aria-hidden="true" />
                            <span className={styles.toggleLabel}>
                                {draft.showExpertOptions ? "Ocultar Aditivos" : "Agregar Aditivos"}
                            </span>
                        </label>
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
            {/* REMOVED: Floating alerts. Using inline validation only. */}

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
                    onScrollToTop={scrollToCalcTop}
                />

            </div>
        </div>
    );
}

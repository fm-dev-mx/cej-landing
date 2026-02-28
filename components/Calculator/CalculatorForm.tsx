// components/Calculator/CalculatorForm.tsx
// Main calculator orchestrator wiring store state to form steps and summary.

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';

import { usePublicStore } from "@/store/public/usePublicStore";
import { useQuoteCalculator } from "@/hooks/useQuoteCalculator";

import { ModeSelector } from "./ModeSelector";
import { EntryScreen } from "./EntryScreen";
import { QuoteSummary } from "./QuoteSummary";
import { trackViewContent } from "@/lib/tracking/visitor";

import { useCalculatorUI } from "@/hooks/useCalculatorUI";
import { KnownVolumeForm } from "./Forms/KnownVolumeForm";
import { WorkTypeSelector } from "./Forms/WorkTypeSelector";
import { AssistVolumeForm } from "./Forms/AssistVolumeForm";
import { SpecsForm } from "./Forms/SpecsForm";
import { AdditivesForm } from "./Forms/AdditivesForm";
import { VolumeAssistant } from "./VolumeAssistant";

import styles from "./CalculatorForm.module.scss";

/**
 * CalculatorForm
 *
 * - Connects the Zustand store draft to individual form sections.
 * - Manages focus when mode changes (via useCalculatorUI hook).
 * - Shows validation errors, warnings and summary (ticket-style).
 */
export function CalculatorForm() {
    const draft = usePublicStore((s) => s.draft);

    // URL Deep Linking for shared quotes (Local history lookup)
    const searchParams = useSearchParams();
    const folioParam = searchParams?.get('folio');
    const setSubmittedQuote = usePublicStore((s) => s.setSubmittedQuote);
    const history = usePublicStore((s) => s.history);
    const cart = usePublicStore((s) => s.cart);
    const editingItemId = usePublicStore((s) => s.editingItemId);
    const cancelEdit = usePublicStore((s) => s.cancelEdit);

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
    const { error, warning, rawVolume, billedM3 } = useQuoteCalculator(draft);

    const submittedQuote = usePublicStore((s) => s.submittedQuote);

    // Local state to track if volume is "confirmed" in assist mode to reveal specs
    const [volumeConfirmed, setVolumeConfirmed] = useState(false);

    // Auto-confirm for knownM3 if valid
    const isVolumeReady = draft.mode === 'knownM3'
        ? (billedM3 > 0 && !error)
        : volumeConfirmed;

    // Friction Analysis Tracking
    useEffect(() => {
        if (draft.mode) {
            trackViewContent(0, 'MXN', `Calculator_Mode_${draft.mode}`);
        }
    }, [draft.mode]);

    useEffect(() => {
        if (draft.workType) {
            trackViewContent(0, 'MXN', `Calculator_WorkType_${draft.workType}`);
        }
    }, [draft.workType]);

    useEffect(() => {
        if (draft.showExpertOptions) {
            trackViewContent(0, 'MXN', 'Calculator_ExpertOptions_Viewed');
        }
    }, [draft.showExpertOptions]);

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

    // If no mode selected, show the Entry Screen (Phase 0)
    if (!draft.mode && !submittedQuote) {
        return <EntryScreen />;
    }

    return (
        <div className={styles.container} ref={formContainerRef}>
            <div className={styles.formLayout}>
                <div className={styles.formMain}>
                    {/* Edit Mode Banner */}
                    {editingItemId && (
                        <div className={styles.editBanner} role="status">
                            <span className={styles.editBannerIcon}>✏️</span>
                            <span>Editando cálculo — tus cambios reemplazarán el item actual.</span>
                            {/* Button to cancel the current edit operation */}
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
                        <div className={styles.fieldHeader}>
                            <label className={styles.label}>¿Cómo quieres cotizar?</label>
                            <button
                                type="button"
                                className={styles.resetLink}
                                onClick={() => usePublicStore.getState().setMode(null)}
                            >
                                Cambiar método
                            </button>
                        </div>
                        <ModeSelector currentMode={draft.mode} />
                    </div>

                    {/* 2. Volume inputs - Wrapped for smooth height transition */}
                    <div className={styles.volumeSection}>
                        {draft.mode === "knownM3" ? (
                            <div className={`${styles.field} ${styles.gamifiedReveal} ${activeField === 'm3' ? styles.activeField : ''}`}>
                                <KnownVolumeForm
                                    hasError={!!error && rawVolume <= 0}
                                    forceValidation={hasTouchedAnyField}
                                    onFieldTouched={handleFieldTouched}
                                />
                            </div>
                        ) : (
                            <VolumeAssistant onComplete={() => setVolumeConfirmed(true)} />
                        )}
                    </div>

                    {/* 3. Specs & additives - Revealed only when volume is ready */}
                    {isVolumeReady && (
                        <div
                            className={`${styles.fieldWithSeparator} ${styles.gamifiedReveal} ${activeField === 'specs' ? styles.activeField : ''}`}
                        >
                            <SpecsForm />
                            {/* Additives Toggle */}
                            <div className={`${styles.field} ${styles.additivesContainer}`}>
                                <label className={`${styles.toggleButton} ${draft.showExpertOptions ? styles.active : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={draft.showExpertOptions}
                                        onChange={() => usePublicStore.getState().setExpertMode(!draft.showExpertOptions)}
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
                </div> {/* End formMain */}

                {/* 5. Summary (ticket-like view) */}
                <div className={`${styles.summarySection} ${draft.mode ? styles.gamifiedReveal : ''}`}>
                    <QuoteSummary
                        hasError={!!error}
                        onFocusError={focusFirstInvalidInput}
                        onScrollToTop={scrollToCalcTop}
                    />
                </div>
            </div> {/* End main formLayout wrapper */}
        </div>
    );
}

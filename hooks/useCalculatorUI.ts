// File: hooks/useCalculatorUI.ts
// Description: Manages UI side effects like focus, scrolling, and active field guidance.

import { useCallback, useRef, useState } from "react";
import type { CalculatorState } from "@/types/domain";

export function useCalculatorUI(draft: CalculatorState) {
    const formContainerRef = useRef<HTMLDivElement>(null);
    const assistVolumeRef = useRef<HTMLDivElement>(null);

    // Track touched state relative to the current mode
    const [touchedState, setTouchedState] = useState<{ mode: string | null; touched: boolean }>({
        mode: draft.mode,
        touched: false,
    });

    const hasTouchedAnyField = touchedState.mode === draft.mode && touchedState.touched;

    const handleFieldTouched = useCallback(() => {
        setTouchedState({ mode: draft.mode, touched: true });
    }, [draft.mode]);

    const scrollToCalcTop = useCallback(() => {
        const sectionEl = document.getElementById('calculator-section');
        if (!sectionEl) return;

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const targetY = sectionEl.getBoundingClientRect().top + window.scrollY - 80;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.scrollTo({
                    top: targetY,
                    behavior: prefersReduced ? 'auto' : 'smooth'
                });
            });
        });
    }, []);

    const focusFirstInvalidInput = useCallback(() => {
        if (!formContainerRef.current) return;

        setTouchedState({ mode: draft.mode, touched: true });

        const invalidInput = formContainerRef.current.querySelector<HTMLElement>(
            'input[aria-invalid="true"], input:invalid'
        );

        if (invalidInput) {
            invalidInput.scrollIntoView({ behavior: "smooth", block: "center" });
            invalidInput.focus();
        }
    }, [draft.mode]);

    // Active field guidance logic
    const getActiveField = () => {
        if (!draft.mode) return 'mode';
        if (draft.mode === 'knownM3') {
            if (!draft.m3) return 'm3';
        } else {
            if (!draft.workType) return 'workType';
            if (draft.workType && (!draft.length || !draft.width)) return 'assistVolume';
        }
        if (!draft.strength || !draft.type) return 'specs';
        return null;
    };

    return {
        formContainerRef,
        assistVolumeRef,
        hasTouchedAnyField,
        handleFieldTouched,
        scrollToCalcTop,
        focusFirstInvalidInput,
        activeField: getActiveField(),
        setTouchedState,
    };
}

// File: components/Calculator/Forms/KnownVolumeForm.tsx
// Description: Simple form for direct known volume (m³) input.

"use client";

import type { ChangeEvent } from "react";
import { useCallback, useState } from "react";

import { useCejStore } from "@/store/useCejStore";
import { Input } from "@/components/ui/Input/Input";
import { getMissingFields } from "@/lib/progress";
import styles from "../CalculatorForm.module.scss";

interface Props {
    hasError?: boolean;
    onFieldTouched?: () => void;
}

export function KnownVolumeForm({ hasError, onFieldTouched }: Props) {
    const draft = useCejStore((s) => s.draft);
    const m3 = draft.m3;
    const updateDraft = useCejStore((s) => s.updateDraft);
    const [touched, setTouched] = useState(false);

    // Derived missing state
    const missing = getMissingFields(draft);
    const isMissing = missing.includes('m3');

    const handleChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value.replace(/,/g, ".");
            const cleaned = raw.replace(/[^0-9.]/g, "");
            updateDraft({ m3: cleaned });
        },
        [updateDraft]
    );

    const handleBlur = () => {
        setTouched(true);
        onFieldTouched?.();
    };

    // Determine which message to show (interaction-based)
    // Determine which message to show
    // We show the indicator (red border) always if missing, but text message only if touched or external error present
    const showError = isMissing;
    const errorMessage = (showError && touched) ? "El volumen debe ser mayor a 0 m³" : showError;

    return (
        <div className={styles.fieldWithHelper}>
            <Input
                id="vol-known"
                label="Volumen Total"
                type="number"
                min={0}
                step={0.5}
                value={m3}
                onChange={handleChange}
                onBlur={handleBlur}
                isVolume
                inputMode="decimal"
                placeholder="0.0"
                suffix="m³"
                error={errorMessage}
            />
            {/* Show guidance text only before interaction and when there's no error */}
            {!touched && !hasError && (
                <p className={styles.helperText}>
                    Ingresa el volumen en m³ para calcular tu cotización
                </p>
            )}
        </div>
    );
}

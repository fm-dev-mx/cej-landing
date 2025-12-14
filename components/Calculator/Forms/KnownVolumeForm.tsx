// File: components/Calculator/Forms/KnownVolumeForm.tsx
// Description: Simple form for direct known volume (m³) input.

"use client";

import type { ChangeEvent } from "react";
import { useCallback, useState } from "react";

import { useCejStore } from "@/store/useCejStore";
import { Input } from "@/components/ui/Input/Input";
import styles from "../CalculatorForm.module.scss";

interface Props {
    hasError?: boolean;
    onFieldTouched?: () => void;
}

export function KnownVolumeForm({ hasError, onFieldTouched }: Props) {
    const m3 = useCejStore((s) => s.draft.m3);
    const updateDraft = useCejStore((s) => s.updateDraft);
    const [touched, setTouched] = useState(false);

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
    const showError = touched && hasError;
    const errorMessage = showError ? "El volumen debe ser mayor a 0 m³" : undefined;

    return (
        <div className={styles.fieldWithHelper}>
            <Input
                id="vol-known"
                label="Volumen Total (m³)"
                type="number"
                min={0}
                step={0.5}
                value={m3}
                onChange={handleChange}
                onBlur={handleBlur}
                isVolume
                inputMode="decimal"
                placeholder="0.0"
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

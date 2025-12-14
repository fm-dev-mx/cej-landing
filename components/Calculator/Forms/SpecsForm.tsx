// File: components/Calculator/Forms/SpecsForm.tsx
// Description: Form section for selecting concrete strength and service type.

"use client";

import type { ChangeEvent } from "react";

import { useCejStore } from "@/store/useCejStore";
import { Select } from "@/components/ui/Select/Select";
import { STRENGTHS, CONCRETE_TYPES } from "@/config/business";
import type { Strength, ConcreteType } from "@/types/domain";

import styles from "../CalculatorForm.module.scss";

export function SpecsForm() {
    const strength = useCejStore((s) => s.draft.strength);
    const type = useCejStore((s) => s.draft.type);
    const update = useCejStore((s) => s.updateDraft);

    const handleStrength = (e: ChangeEvent<HTMLSelectElement>) => {
        update({ strength: e.target.value as Strength });
    };

    const handleType = (e: ChangeEvent<HTMLSelectElement>) => {
        update({ type: e.target.value as ConcreteType });
    };

    return (
        <div className={styles.compactGrid}>
            <div>
                <label
                    htmlFor="strength-select"
                    className={styles.label}
                >
                    Resistencia (f&apos;c)
                </label>
                <Select
                    id="strength-select"
                    value={strength || ""}
                    onChange={handleStrength}
                    variant="dark"
                >
                    <option value="" disabled>Selecciona...</option>
                    {STRENGTHS.map((s) => (
                        <option key={s} value={s}>
                            {s} kg/cm²
                        </option>
                    ))}
                </Select>
            </div>

            <div>
                <label
                    htmlFor="service-select"
                    className={styles.label}
                >
                    Servicio
                </label>
                <Select
                    id="service-select"
                    value={type || ""}
                    onChange={handleType}
                    variant="dark"
                >
                    <option value="" disabled>Selecciona...</option>
                    {CONCRETE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </Select>
            </div>
        </div>
    );
}

// File: components/Calculator/Forms/SpecsForm.tsx
// Description: Form section for selecting concrete strength and service type.

"use client";

import { usePublicStore } from "@/store/public/usePublicStore";
import { Select } from "@/components/ui/Select/Select";
import { STRENGTHS, CONCRETE_TYPES } from "@/config/business";
import type { Strength, ConcreteType } from "@/types/domain";

import { getMissingFields, type CalculatorFieldId } from "@/lib/progress";

import styles from "../CalculatorForm.module.scss";

export function SpecsForm() {
    const draft = usePublicStore((s) => s.draft);
    const { strength, type } = draft;
    const update = usePublicStore((s) => s.updateDraft);
    const missing = getMissingFields(draft);

    const isMissing = (id: CalculatorFieldId) => missing.includes(id);

    const handleStrength = (e: { target: { value: string } }) => {
        update({ strength: e.target.value as Strength });
    };

    const handleType = (e: { target: { value: string } }) => {
        update({ type: e.target.value as ConcreteType });
    };

    return (
        <div className={styles.compactGrid}>
            <div>
                <label
                    htmlFor="strength-select"
                    id="strength-label"
                    className={styles.label}
                >
                    Resistencia (f&apos;c)
                </label>
                <Select
                    id="strength-select"
                    aria-labelledby="strength-label"
                    value={strength || ""}
                    onChange={handleStrength}
                    variant="dark"
                    error={isMissing('strength')}
                    options={[
                        { label: "Selecciona...", value: "", disabled: true },
                        ...STRENGTHS.map(s => ({ label: `${s} kg/cm²`, value: s }))
                    ]}
                    placeholder="Selecciona..."
                />
            </div>

            <div>
                <label
                    htmlFor="service-select"
                    id="service-label"
                    className={styles.label}
                >
                    Servicio
                </label>
                <Select
                    id="service-select"
                    aria-labelledby="service-label"
                    value={type || ""}
                    onChange={handleType}
                    variant="dark"
                    error={isMissing('type')}
                    options={[
                        { label: "Selecciona...", value: "", disabled: true },
                        ...CONCRETE_TYPES.map(t => ({ label: t.label, value: t.value }))
                    ]}
                    placeholder="Selecciona..."
                />
            </div>
        </div>
    );
}

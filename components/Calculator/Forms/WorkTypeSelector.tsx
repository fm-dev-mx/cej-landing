// File: components/Calculator/Forms/WorkTypeSelector.tsx
// Description: Selector for work type (affects recommended strength and slab logic).

"use client";

import { usePublicStore } from "@/store/public/usePublicStore";
import { WORK_TYPES } from "@/config/business";
import { Select } from "@/components/ui/Select/Select";
import type { WorkTypeId } from "@/types/domain";

import styles from "../CalculatorForm.module.scss";

export function WorkTypeSelector() {
    const workType = usePublicStore((s) => s.draft.workType);
    const updateDraft = usePublicStore((s) => s.updateDraft);

    const handleChange = (e: { target: { value: string } }) => {
        const val = e.target.value as WorkTypeId | "";
        updateDraft({ workType: val || null });
    };

    return (
        <>
            <label
                htmlFor="work-type-select"
                id="work-type-label"
                className={styles.label}
            >
                ¿Para qué usarás el concreto?
            </label>

            <Select
                id="work-type-select"
                aria-labelledby="work-type-label"
                value={workType || ""}
                onChange={handleChange}
                variant="dark"
                className={workType ? styles.selectorActive : undefined}
                options={[
                    { label: "Selecciona una opción...", value: "", disabled: true },
                    ...WORK_TYPES.map(w => ({ label: w.label, value: w.id }))
                ]}
                placeholder="Selecciona una opción..."
            />

            <p className={styles.selectorHint}>
                Seleccionar el tipo ajusta automáticamente la resistencia
                recomendada.
            </p>
        </>
    );
}

// File: components/Calculator/Forms/WorkTypeSelector.tsx
// Description: Selector for work type (affects recommended strength and slab logic).

"use client";

import { useCejStore } from "@/store/useCejStore";
import { WORK_TYPES } from "@/config/business";
import { Select } from "@/components/ui/Select/Select";
import type { WorkTypeId } from "@/types/domain";

import styles from "../CalculatorForm.module.scss";

export function WorkTypeSelector() {
    const workType = useCejStore((s) => s.draft.workType);
    const setWorkType = useCejStore((s) => s.setWorkType);

    const handleChange = (e: { target: { value: string } }) => {
        const val = e.target.value as WorkTypeId | "";
        setWorkType(val || null);
    };

    return (
        <>
            <label
                htmlFor="work-type-select"
                id="work-type-label"
                className={styles.label}
            >
                Tipo de Obra
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

            <p
                style={{
                    fontSize: "0.75rem",
                    color: "#94a3b8",
                    marginTop: "0.5rem",
                }}
            >
                Seleccionar el tipo ajusta automáticamente la resistencia
                recomendada.
            </p>
        </>
    );
}

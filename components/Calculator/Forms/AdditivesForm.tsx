// File: components/Calculator/Forms/AdditivesForm.tsx
// Description: Form section for selecting optional additives with robust testing hooks.

"use client";

import { useMemo } from "react";
import { useCejStore } from "@/store/useCejStore";
import { SelectionCard } from "@/components/ui/SelectionCard/SelectionCard";
import { DEFAULT_PRICING_RULES } from "@/lib/pricing";
import { fmtMXN } from "@/lib/utils";

import styles from "../CalculatorForm.module.scss";

export function AdditivesForm() {
    // Select specific slices to avoid unnecessary re-renders
    const selectedAdditives = useCejStore((s) => s.draft.additives);
    const toggleAdditive = useCejStore((s) => s.toggleAdditive);

    // Memoize active additives to prevent recalculation on every render
    const additives = useMemo(() =>
        DEFAULT_PRICING_RULES.additives.filter((a) => a.active),
        []);

    if (additives.length === 0) return null;

    return (
        <div className={styles.fieldWithSeparator} data-testid="additives-form">
            <label className={styles.label}>
                Aditivos y Extras{" "}
                <span className={styles.labelOptional}>(Opcional)</span>
            </label>

            <div className={styles.selectionGrid}>
                {additives.map((addon) => {
                    const isSelected = selectedAdditives.includes(addon.id);
                    const priceLabel =
                        addon.pricingModel === "per_m3"
                            ? `${fmtMXN(addon.priceCents / 100)} / m³`
                            : `${fmtMXN(addon.priceCents / 100)} fijo`;

                    return (
                        <SelectionCard
                            key={addon.id}
                            id={`addon-${addon.id}`}
                            data-testid={`addon-card-${addon.id}`}
                            type="checkbox"
                            label={addon.label}
                            description={`${addon.description} (${priceLabel})`}
                            isSelected={isSelected}
                            onChange={() => toggleAdditive(addon.id)}
                            customIndicator={isSelected ? <span>✔</span> : null}
                        />
                    );
                })}
            </div>
        </div>
    );
}

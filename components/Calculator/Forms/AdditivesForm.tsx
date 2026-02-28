// File: components/Calculator/Forms/AdditivesForm.tsx
// Description: Form section for selecting optional additives with robust testing hooks.

"use client";

import { useMemo } from "react";
import { usePublicStore } from "@/store/public/usePublicStore";
import { SelectionCard } from "@/components/ui/SelectionCard/SelectionCard";
import { DEFAULT_PRICING_RULES } from "@/lib/pricing";
import { fmtMXN } from "@/lib/utils";

import styles from "../CalculatorForm.module.scss";

export function AdditivesForm() {
    const draft = usePublicStore((s) => s.draft);
    const updateDraft = usePublicStore((s) => s.updateDraft);

    // Memoize active additives to prevent recalculation on every render
    const additives = useMemo(() =>
        DEFAULT_PRICING_RULES.additives.filter((a) => a.active),
        []);

    if (additives.length === 0) return null;

    return (
        <div className={styles.additivesContainer} data-testid="additives-form">
            <label className={styles.label}>
                Aditivos y Extras{" "}
                <span className={styles.labelOptional}></span>
            </label>

            <div className={styles.selectionGrid}>
                {additives.map((addon) => {
                    const isSelected = draft.additives.includes(addon.id);
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
                            onChange={() => {
                                const isSelected = draft.additives.includes(addon.id);
                                const newAdditives = isSelected
                                    ? draft.additives.filter((a) => a !== addon.id)
                                    : [...draft.additives, addon.id];
                                updateDraft({ additives: newAdditives });
                            }}
                            customIndicator={isSelected ? <span>✔</span> : null}
                        />
                    );
                })}
            </div>
        </div>
    );
}

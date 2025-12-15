// File: components/Calculator/Forms/AssistVolumeForm.tsx
// Description: Assisted volume form (dimensions or area), including slab type and coffering.

"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";

import { useCejStore } from "@/store/useCejStore";
import { useShallow } from "zustand/react/shallow";

import { Input } from "@/components/ui/Input/Input";
import type { CofferedSize } from "@/types/domain";

import styles from "../CalculatorForm.module.scss";

interface Props {
    error?: string | null;
    onFieldTouched?: (field: string) => void;
}

export function AssistVolumeForm({ error, onFieldTouched }: Props) {
    const {
        volumeMode,
        length,
        width,
        area,
        thicknessByDims,
        thicknessByArea,
        workType,
        hasCoffered,
        cofferedSize,
    } = useCejStore(
        useShallow((s) => ({
            volumeMode: s.draft.volumeMode,
            length: s.draft.length,
            width: s.draft.width,
            area: s.draft.area,
            thicknessByDims: s.draft.thicknessByDims,
            thicknessByArea: s.draft.thicknessByArea,
            workType: s.draft.workType,
            hasCoffered: s.draft.hasCoffered,
            cofferedSize: s.draft.cofferedSize,
        }))
    );

    const update = useCejStore((s) => s.updateDraft);
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [showOverride, setShowOverride] = useState(false);

    const handleNumeric =
        (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value
                .replace(/,/g, ".")
                .replace(/[^0-9.]/g, "");
            update({ [field]: val });
        };

    const handleBlur = (field: string) => () => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        onFieldTouched?.(field);
    };

    const hasSpecificError = (field: string, val: string) =>
        !!touched[field] && !!error && (!val || parseFloat(val) <= 0);

    return (
        <>
            {/* Volume mode switch (dimensions vs area) */}
            <div className={styles.fieldCompact}>
                <label className={styles.label}>Método de cálculo</label>

                <div className={styles.radioRow}>
                    <label className={styles.radio}>
                        <input
                            type="radio"
                            name="volume-mode"
                            value="dimensions"
                            checked={volumeMode === "dimensions"}
                            onChange={() => update({ volumeMode: "dimensions" })}
                        />
                        <span>Largo × Ancho</span>
                    </label>

                    <label className={styles.radio}>
                        <input
                            type="radio"
                            name="volume-mode"
                            value="area"
                            checked={volumeMode === "area"}
                            onChange={() => update({ volumeMode: "area" })}
                        />
                        <span>Por Área (m²)</span>
                    </label>
                </div>
            </div>

            {/* Dimension or area inputs */}
            {volumeMode === "dimensions" ? (
                <div className={styles.compactGrid}>
                    <Input
                        label="Largo"
                        placeholder="0.00"
                        suffix="metros"
                        value={length}
                        onChange={handleNumeric("length")}
                        onBlur={handleBlur("length")}
                        inputMode="decimal"
                        variant="dark"
                        error={hasSpecificError("length", length)}
                    />
                    <Input
                        label="Ancho"
                        placeholder="0.00"
                        suffix="metros"
                        value={width}
                        onChange={handleNumeric("width")}
                        onBlur={handleBlur("width")}
                        inputMode="decimal"
                        variant="dark"
                        error={hasSpecificError("width", width)}
                    />
                </div>
            ) : (
                <Input
                    label="Área total"
                    placeholder="0.00"
                    suffix="m²"
                    value={area}
                    onChange={handleNumeric("area")}
                    onBlur={handleBlur("area")}
                    inputMode="decimal"
                    variant="dark"
                    error={hasSpecificError("area", area)}
                />
            )}

            {/* Manual thickness / Compression Layer Logic */}
            <div className={styles.spacingTop}>
                {workType === 'slab' && hasCoffered === 'yes' ? (
                    // Logic for Coffered Slab (Aligerada)
                    <div className={styles.fieldCompact}>
                        <div className={styles.compressionHeader}>
                            <span className={styles.label}>Capa de Compresión</span>
                        </div>

                        {!showOverride ? (
                            <>
                                <div className={`${styles.note} ${styles.compressionNote}`}>
                                    Incluye capa estándar de <strong>5 cm</strong>.
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowOverride(true)}
                                    className={styles.editDataBtn}
                                >
                                    Modificar
                                </button>
                            </>
                        ) : (
                            <div className={styles.animateFadeIn}>
                                <Input
                                    label="Grosor Capa Compresión"
                                    placeholder="5"
                                    suffix="cm"
                                    value={volumeMode === "dimensions" ? thicknessByDims : thicknessByArea}
                                    onChange={handleNumeric(volumeMode === "dimensions" ? "thicknessByDims" : "thicknessByArea")}
                                    inputMode="decimal"
                                    variant="dark"
                                    error={hasSpecificError(volumeMode === "dimensions" ? "thicknessByDims" : "thicknessByArea", volumeMode === "dimensions" ? thicknessByDims : thicknessByArea)}
                                />
                                <p className={styles.hint}>
                                    El espesor estándar es de 5cm. Solo modifica si tu proyecto estructural requiere un espesor mayor.
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    // Logic for Standard/Solid Slabs or other types
                    <Input
                        label={workType === 'slab' ? "Espesor Total de Losa" : "Grosor"}
                        placeholder={workType === 'slab' ? "10" : "10"}
                        suffix="cm"
                        value={volumeMode === "dimensions" ? thicknessByDims : thicknessByArea}
                        onChange={handleNumeric(volumeMode === "dimensions" ? "thicknessByDims" : "thicknessByArea")}
                        inputMode="decimal"
                        variant="dark"
                        error={hasSpecificError(volumeMode === "dimensions" ? "thicknessByDims" : "thicknessByArea", volumeMode === "dimensions" ? thicknessByDims : thicknessByArea)}
                    />
                )}
            </div>

            {/* Slab type and coffered configuration */}
            {workType === "slab" && (
                <div className={styles.cofferSection}>
                    <label className={styles.cofferLabel}>Tipo de Losa</label>

                    <div className={styles.pillGroup}>
                        <label className={styles.pill}>
                            <input
                                type="radio"
                                name="isCoffered"
                                checked={hasCoffered === "no"}
                                onChange={() => {
                                    update({
                                        hasCoffered: "no",
                                        // Reset to standard slab thickness defaults
                                        thicknessByDims: "12",
                                        thicknessByArea: "12"
                                    });
                                    setShowOverride(false);
                                }}
                            />
                            <span>Sólida (Maciza)</span>
                        </label>

                        <label className={styles.pill}>
                            <input
                                type="radio"
                                name="isCoffered"
                                checked={hasCoffered === "yes"}
                                onChange={() => {
                                    update({
                                        hasCoffered: "yes",
                                        cofferedSize: "7",
                                        // Reset to standard compression layer (5cm) for Coffered
                                        thicknessByDims: "5",
                                        thicknessByArea: "5"
                                    });
                                    setShowOverride(false);
                                }}
                            />
                            <span>Aligerada (Casetón)</span>
                        </label>
                    </div>

                    {hasCoffered === "yes" && (
                        <div className={`${styles.spacingTop} ${styles.animateFadeIn}`}>
                            <label className={styles.cofferLabel}>
                                Medida del Casetón
                            </label>

                            <div className={styles.pillGroup}>
                                {(["7", "10", "15"] as const).map((size) => (
                                    <label key={size} className={styles.pill}>
                                        <input
                                            type="radio"
                                            name="cofferSize"
                                            checked={cofferedSize === size}
                                            onChange={() =>
                                                update({
                                                    cofferedSize:
                                                        size as CofferedSize,
                                                })
                                            }
                                        />
                                        <span>{size} cm</span>
                                    </label>
                                ))}
                            </div>

                            <p className={styles.hint}>
                                Calculamos el volumen usando el coeficiente de
                                aporte estándar.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

'use client';

import { type ChangeEvent, useCallback } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { useShallow } from 'zustand/react/shallow';
import { Input } from '@/components/ui/Input/Input';
import { type CofferedSize } from '@/components/Calculator/types';
import styles from '../../CalculatorForm.module.scss';

interface Props {
    error?: string | null;
}

export function AssistVolumeForm({ error }: Props) {
    // 1. Select State efficiently
    const {
        volumeMode, length, width, area,
        thicknessByDims, thicknessByArea,
        workType, hasCoffered, cofferedSize
    } = useCejStore(useShallow((s) => ({
        volumeMode: s.draft.volumeMode,
        length: s.draft.length,
        width: s.draft.width,
        area: s.draft.area,
        thicknessByDims: s.draft.thicknessByDims,
        thicknessByArea: s.draft.thicknessByArea,
        workType: s.draft.workType,
        hasCoffered: s.draft.hasCoffered,
        cofferedSize: s.draft.cofferedSize
    })));

    const update = useCejStore((s) => s.updateDraft);

    // 2. Helpers
    const handleNumeric = (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
        update({ [field]: val });
    };

    const hasSpecificError = (val: string) => !!error && (!val || parseFloat(val) <= 0);
    const showManualThickness = hasCoffered !== 'yes';

    return (
        <>
            <div className={styles.field}>
                <label className={styles.label}>Método de cálculo</label>
                <div className={styles.radioRow}>
                    <label className={styles.radio}>
                        <input
                            type="radio"
                            name="volume-mode"
                            value="dimensions"
                            checked={volumeMode === 'dimensions'}
                            onChange={() => update({ volumeMode: 'dimensions' })}
                        />
                        <span>Largo × Ancho</span>
                    </label>
                    <label className={styles.radio}>
                        <input
                            type="radio"
                            name="volume-mode"
                            value="area"
                            checked={volumeMode === 'area'}
                            onChange={() => update({ volumeMode: 'area' })}
                        />
                        <span>Por Área (m²)</span>
                    </label>
                </div>
            </div>

            {/* Inputs based on Mode */}
            {volumeMode === 'dimensions' ? (
                <div className={styles.compactGrid}>
                    <Input
                        label="Largo (m)"
                        placeholder="0.00"
                        value={length}
                        onChange={handleNumeric('length')}
                        inputMode="decimal"
                        variant="dark"
                        error={hasSpecificError(length)}
                    />
                    <Input
                        label="Ancho (m)"
                        placeholder="0.00"
                        value={width}
                        onChange={handleNumeric('width')}
                        inputMode="decimal"
                        variant="dark"
                        error={hasSpecificError(width)}
                    />
                </div>
            ) : (
                <Input
                    label="Área total (m²)"
                    placeholder="0.00"
                    value={area}
                    onChange={handleNumeric('area')}
                    inputMode="decimal"
                    variant="dark"
                    error={hasSpecificError(area)}
                />
            )}

            {/* Thickness (If Solid) */}
            {showManualThickness && (
                <div style={{ marginTop: '1rem' }}>
                    <Input
                        label="Grosor (cm)"
                        placeholder="10"
                        value={volumeMode === 'dimensions' ? thicknessByDims : thicknessByArea}
                        onChange={handleNumeric(volumeMode === 'dimensions' ? 'thicknessByDims' : 'thicknessByArea')}
                        inputMode="decimal"
                        variant="dark"
                    />
                </div>
            )}

            {/* Slab Logic (Solid vs Coffered) */}
            {workType === 'slab' && (
                <div className={styles.cofferSection}>
                    <label className={styles.cofferLabel}>Tipo de Losa</label>
                    <div className={styles.pillGroup}>
                        <label className={styles.pill}>
                            <input
                                type="radio"
                                name="isCoffered"
                                checked={hasCoffered === 'no'}
                                onChange={() => update({ hasCoffered: 'no' })}
                            />
                            <span>Sólida (Maciza)</span>
                        </label>
                        <label className={styles.pill}>
                            <input
                                type="radio"
                                name="isCoffered"
                                checked={hasCoffered === 'yes'}
                                onChange={() => update({ hasCoffered: 'yes', cofferedSize: '7' })}
                            />
                            <span>Aligerada (Casetón)</span>
                        </label>
                    </div>

                    {hasCoffered === 'yes' && (
                        <div style={{ marginTop: '1rem', animation: 'fadeIn 0.3s' }}>
                            <label className={styles.cofferLabel}>Medida del Casetón</label>
                            <div className={styles.pillGroup}>
                                {(['7', '10', '15'] as const).map((size) => (
                                    <label key={size} className={styles.pill}>
                                        <input
                                            type="radio"
                                            name="cofferSize"
                                            checked={cofferedSize === size}
                                            onChange={() => update({ cofferedSize: size as CofferedSize })}
                                        />
                                        <span>{size} cm</span>
                                    </label>
                                ))}
                            </div>
                            <p className={styles.hint}>
                                Calculamos el volumen usando el coeficiente de aporte estándar.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

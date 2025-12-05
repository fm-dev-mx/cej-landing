// components/Calculator/steps/forms/AssistVolumeForm.tsx
'use client';

import { type ChangeEvent, useCallback } from 'react';
import { useCalculatorContext } from '../../context/CalculatorContext';
import { Input } from '@/components/ui/Input/Input';
import styles from '../../Calculator.module.scss';

export function AssistVolumeForm() {
    const {
        volumeMode,
        setVolumeMode,
        length,
        setLength,
        width,
        setWidth,
        thicknessByDims,
        setThicknessByDims,
        area,
        setArea,
        thicknessByArea,
        setThicknessByArea,
        workType,
        hasCoffered,
        setHasCoffered,
        cofferedSize,
        setCofferedSize,
        volumeError
    } = useCalculatorContext();

    // Helper: cast volumeError to boolean (!!) to prevent returning 'null' which Input props reject
    const hasError = (value: string) => !!volumeError && (!value || parseFloat(value) <= 0);

    const handleNumericInput = useCallback(
        (setter: (value: string) => void) => (e: ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value.replace(/,/g, '.');
            const cleaned = raw.replace(/[^0-9.]/g, '');
            setter(cleaned);
        },
        []
    );

    return (
        <>
            <div className={styles.field}>
                <label>Método de cálculo</label>
                <div className={styles.radioRow}>
                    <label className={styles.radio}>
                        <input
                            type="radio"
                            name="volume-mode"
                            value="dimensions"
                            checked={volumeMode === 'dimensions'}
                            onChange={() => setVolumeMode('dimensions')}
                        />
                        <span>Largo × Ancho</span>
                    </label>
                    <label className={styles.radio}>
                        <input
                            type="radio"
                            name="volume-mode"
                            value="area"
                            checked={volumeMode === 'area'}
                            onChange={() => setVolumeMode('area')}
                        />
                        <span>Por Área (m²)</span>
                    </label>
                </div>
            </div>

            {volumeMode === 'dimensions' && (
                <>
                    <div className={styles.compactGrid}>
                        <Input
                            id="length"
                            label="Largo (m)"
                            type="number"
                            min={0}
                            step={0.5}
                            value={length}
                            onChange={handleNumericInput(setLength)}
                            inputMode="decimal"
                            placeholder="0.00"
                            error={hasError(length)}
                        />
                        <Input
                            id="width"
                            label="Ancho (m)"
                            type="number"
                            min={0}
                            step={0.5}
                            value={width}
                            onChange={handleNumericInput(setWidth)}
                            inputMode="decimal"
                            placeholder="0.00"
                            error={hasError(width)}
                        />
                    </div>

                    <Input
                        id="thickness-dims"
                        label="Grosor (cm)"
                        type="number"
                        min={0}
                        step={1}
                        value={thicknessByDims}
                        onChange={handleNumericInput(setThicknessByDims)}
                        inputMode="decimal"
                        placeholder="10"
                        error={hasError(thicknessByDims)}
                    />
                </>
            )}

            {volumeMode === 'area' && (
                <>
                    <Input
                        id="area"
                        label="Área total (m²)"
                        type="number"
                        min={0}
                        step={0.1}
                        value={area}
                        onChange={handleNumericInput(setArea)}
                        inputMode="decimal"
                        placeholder="0.00"
                        error={hasError(area)}
                    />
                    <Input
                        id="thickness-area"
                        label="Grosor (cm)"
                        type="number"
                        min={0}
                        step={1}
                        value={thicknessByArea}
                        onChange={handleNumericInput(setThicknessByArea)}
                        inputMode="decimal"
                        placeholder="10"
                        error={hasError(thicknessByArea)}
                    />
                </>
            )}

            {/* Lightened Slab (Coffered) Block */}
            {workType === 'slab' && (
                <>
                    <div className={styles.field}>
                        <label>¿La losa lleva casetón?</label>
                        <div className={styles.radioRow}>
                            <label className={styles.radio}>
                                <input
                                    type="radio"
                                    name="coffered"
                                    value="no"
                                    checked={hasCoffered === 'no'}
                                    onChange={() => setHasCoffered('no')}
                                />
                                <span>No (Sólida)</span>
                            </label>
                            <label className={styles.radio}>
                                <input
                                    type="radio"
                                    name="coffered"
                                    value="yes"
                                    checked={hasCoffered === 'yes'}
                                    onChange={() => setHasCoffered('yes')}
                                />
                                <span>Sí (Aligerada)</span>
                            </label>
                        </div>
                    </div>

                    {hasCoffered === 'yes' && (
                        <div className={`${styles.stepAnimated} ${styles.cofferSection}`}>
                            <label className={styles.cofferLabel}>
                                Altura del casetón:
                            </label>

                            <div className={styles.pillGroup}>
                                <label className={styles.pill}>
                                    <input
                                        type="radio"
                                        name="coffered-size"
                                        value="10"
                                        checked={cofferedSize === '10'}
                                        onChange={() => setCofferedSize('10')}
                                    />
                                    <span>10 cm</span>
                                </label>

                                <label className={styles.pill}>
                                    <input
                                        type="radio"
                                        name="coffered-size"
                                        value="7"
                                        checked={cofferedSize === '7'}
                                        onChange={() => setCofferedSize('7')}
                                    />
                                    <span>7 cm</span>
                                </label>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
}

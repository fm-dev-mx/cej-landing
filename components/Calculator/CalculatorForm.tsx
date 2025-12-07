// components/Calculator/CalculatorForm.tsx
'use client';

import { type ChangeEvent } from 'react';
import { useCejStore } from '@/store/useCejStore';
import { useShallow } from 'zustand/react/shallow';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator';
import { WORK_TYPES, STRENGTHS, CONCRETE_TYPES } from '@/config/business';
import { SelectionCard } from '@/components/ui/SelectionCard/SelectionCard';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { CalculatorSummary } from './CalculatorSummary';
import { type WorkTypeId, type Strength, type ConcreteType, type CofferedSize } from './types';
import styles from './CalculatorSteps.module.scss';

export function CalculatorForm() {
    // 1. Store Connection
    const draft = useCejStore((s) => s.draft);

    const actions = useCejStore(useShallow((s) => ({
        update: s.updateDraft,
        setMode: s.setMode,
        setWorkType: s.setWorkType,
    })));

    // 2. Business Logic
    const { quote, isValid, error, warning } = useQuoteCalculator(draft);

    // 3. Event Handlers
    const handleNumeric = (field: keyof typeof draft) => (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
        actions.update({ [field]: val });
    };

    const handleWorkTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as WorkTypeId | '';
        actions.setWorkType(value || null);
    };

    const handleStrengthChange = (e: ChangeEvent<HTMLSelectElement>) => {
        actions.update({ strength: e.target.value as Strength });
    };

    const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
        actions.update({ type: e.target.value as ConcreteType });
    };

    const handleCofferedSizeChange = (size: CofferedSize) => {
        actions.update({ cofferedSize: size });
    };

    return (
        <div className={styles.stepBody}>
            {/* --- SECTION 1: MODE --- */}
            <div className={styles.field}>
                <label className={styles.label}>¿Cómo quieres cotizar?</label>
                <div className={styles.selectionGrid}>
                    <SelectionCard
                        id="mode-known"
                        name="mode"
                        value="knownM3"
                        label="Sé la cantidad"
                        description="Tengo los m³ exactos."
                        isSelected={draft.mode === 'knownM3'}
                        onChange={() => actions.setMode('knownM3')}
                    />
                    <SelectionCard
                        id="mode-assist"
                        name="mode"
                        value="assistM3"
                        label="Ayúdame a calcular"
                        description="En base a medidas."
                        customIndicator="📐"
                        isSelected={draft.mode === 'assistM3'}
                        onChange={() => actions.setMode('assistM3')}
                    />
                </div>
            </div>

            {/* --- SECTION 2: DYNAMIC INPUTS --- */}
            {draft.mode === 'knownM3' ? (
                <div className={styles.field}>
                    <Input
                        id="m3-input"
                        label="Volumen total (m³)"
                        placeholder="0.0"
                        value={draft.m3}
                        onChange={handleNumeric('m3')}
                        type="number"
                        inputMode="decimal"
                        variant="dark"
                        isVolume
                    />
                </div>
            ) : (
                <>
                    {/* Work Type */}
                    <div className={styles.field}>
                        <label htmlFor="work-type-select" className={styles.label}>Tipo de Obra</label>
                        <Select
                            id="work-type-select"
                            value={draft.workType || ''}
                            onChange={handleWorkTypeChange}
                            variant="dark"
                        >
                            <option value="" disabled>Selecciona una opción...</option>
                            {WORK_TYPES.map((w) => (
                                <option key={w.id} value={w.id}>{w.label}</option>
                            ))}
                        </Select>
                        <p className={styles.hint}>Seleccionar el tipo ajusta la resistencia recomendada.</p>
                    </div>

                    {/* Dimensions */}
                    {draft.workType && (
                        <div className={styles.field}>
                            <label className={styles.label}>Medidas (metros)</label>
                            <div className={styles.compactGrid}>
                                <Input
                                    label="Largo"
                                    placeholder="0.00"
                                    value={draft.length}
                                    onChange={handleNumeric('length')}
                                    inputMode="decimal"
                                    variant="dark"
                                />
                                <Input
                                    label="Ancho"
                                    placeholder="0.00"
                                    value={draft.width}
                                    onChange={handleNumeric('width')}
                                    inputMode="decimal"
                                    variant="dark"
                                />
                            </div>

                            {/* Logic for Coffered vs Solid */}
                            {draft.workType === 'slab' ? (
                                <div className={styles.cofferSection}>
                                    <label className={styles.cofferLabel}>Tipo de Losa</label>
                                    <div className={styles.pillGroup}>
                                        <label className={styles.pill}>
                                            <input
                                                type="radio"
                                                name="isCoffered"
                                                checked={draft.hasCoffered === 'no'}
                                                onChange={() => actions.update({ hasCoffered: 'no' })}
                                            />
                                            <span>Sólida</span>
                                        </label>
                                        <label className={styles.pill}>
                                            <input
                                                type="radio"
                                                name="isCoffered"
                                                checked={draft.hasCoffered === 'yes'}
                                                onChange={() => actions.update({ hasCoffered: 'yes', cofferedSize: '7' })}
                                            />
                                            <span>Aligerada</span>
                                        </label>
                                    </div>

                                    {draft.hasCoffered === 'yes' ? (
                                        <div style={{ marginTop: '1rem' }}>
                                            <label className={styles.cofferLabel}>Medida Casetón</label>
                                            <div className={styles.pillGroup}>
                                                {(['7', '10', '15'] as const).map((size) => (
                                                    <label key={size} className={styles.pill}>
                                                        <input
                                                            type="radio"
                                                            name="cofferSize"
                                                            checked={draft.cofferedSize === size}
                                                            onChange={() => handleCofferedSizeChange(size)}
                                                        />
                                                        <span>{size} cm</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ marginTop: '1rem' }}>
                                            <Input
                                                label="Grosor (cm)"
                                                placeholder="10"
                                                value={draft.thicknessByDims}
                                                onChange={handleNumeric('thicknessByDims')}
                                                inputMode="decimal"
                                                variant="dark"
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ marginTop: '1rem' }}>
                                    <Input
                                        label="Grosor (cm)"
                                        placeholder="10"
                                        value={draft.thicknessByDims}
                                        onChange={handleNumeric('thicknessByDims')}
                                        inputMode="decimal"
                                        variant="dark"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* --- SECTION 3: SPECS --- */}
            <div className={styles.field} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '1rem' }}>
                <div className={styles.compactGrid}>
                    <div>
                        <label htmlFor="strength-select" className={styles.label}>Resistencia</label>
                        <Select
                            id="strength-select"
                            value={draft.strength}
                            onChange={handleStrengthChange}
                            variant="dark"
                        >
                            {STRENGTHS.map(s => <option key={s} value={s}>f'c {s}</option>)}
                        </Select>
                    </div>
                    <div>
                        <label htmlFor="service-select" className={styles.label}>Servicio</label>
                        <Select
                            id="service-select"
                            value={draft.type}
                            onChange={handleTypeChange}
                            variant="dark"
                        >
                            {CONCRETE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </Select>
                    </div>
                </div>
            </div>

            {/* --- SECTION 4: ERROR & WARNINGS --- */}
            {error && (
                <div className={styles.error} role="alert">
                    {error}
                </div>
            )}

            {!error && warning && (
                <div className={styles.note}>
                    {warning.code === 'BELOW_MINIMUM' && (
                        <span>Mínimo {warning.minM3} m³. Se cobrará el mínimo.</span>
                    )}
                    {warning.code === 'ROUNDING_POLICY' && (
                        <span>Redondeado a múltiplos de 0.5 m³.</span>
                    )}
                </div>
            )}

            {/* --- SECTION 5: RESULT & ACTION --- */}
            <CalculatorSummary
                quote={quote}
                isValid={isValid && !error}
            />
        </div>
    );
}

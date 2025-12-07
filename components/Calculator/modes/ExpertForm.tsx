// components/Calculator/modes/ExpertForm.tsx
'use client';

import { useCejStore } from '@/store/useCejStore';
import { useQuoteCalculator } from '@/hooks/useQuoteCalculator'; // Usamos el hook raíz unificado
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { STRENGTHS, CONCRETE_TYPES } from '@/config/business';
import { type Strength, type ConcreteType } from '../types';
import { fmtMXN } from '@/lib/utils';
import styles from './ExpertForm.module.scss';

export default function ExpertForm() {
    // 1. Conectar con el Store Global Unificado
    // Ya no usamos el hook eliminado, leemos directamente del 'draft' del store
    const draft = useCejStore(s => s.draft);
    const update = useCejStore(s => s.updateDraft);
    const reset = useCejStore(s => s.resetDraft);
    const addToCart = useCejStore(s => s.addToCart);
    const viewMode = useCejStore(s => s.viewMode);

    // 2. Calcular en tiempo real usando el hook unificado de lógica de negocio
    const { quote, isValid } = useQuoteCalculator(draft);

    // Helpers locales para actualizar el store de forma limpia
    const handleLength = (e: React.ChangeEvent<HTMLInputElement>) => update({ length: e.target.value });
    const handleWidth = (e: React.ChangeEvent<HTMLInputElement>) => update({ width: e.target.value });

    // En modo experto asumimos cálculo por dimensiones por defecto
    const handleThickness = (e: React.ChangeEvent<HTMLInputElement>) =>
        update({ thicknessByDims: e.target.value, volumeMode: 'dimensions' });

    const handleStrength = (e: React.ChangeEvent<HTMLSelectElement>) =>
        update({ strength: e.target.value as Strength });

    const handleType = (e: React.ChangeEvent<HTMLSelectElement>) =>
        update({ type: e.target.value as ConcreteType });

    const handleAdd = () => {
        if (isValid) {
            addToCart(quote, viewMode);
        }
    };

    return (
        <div className={styles.expertContainer}>
            <header className={styles.header}>
                <h2 className={styles.title}>Cálculo Rápido</h2>
                <button type="button" onClick={reset} className={styles.resetBtn}>
                    Limpiar
                </button>
            </header>

            <div className={styles.grid}>
                {/* Dimensions Group */}
                <div className={styles.group}>
                    <label className={styles.label}>Medidas (m)</label>
                    <div className={styles.row3}>
                        <Input
                            placeholder="Largo"
                            type="number"
                            value={draft.length}
                            onChange={handleLength}
                            variant="light"
                        />
                        <Input
                            placeholder="Ancho"
                            type="number"
                            value={draft.width}
                            onChange={handleWidth}
                            variant="light"
                        />
                        <Input
                            placeholder="Grosor (cm)"
                            type="number"
                            value={draft.thicknessByDims}
                            onChange={handleThickness}
                            variant="light"
                        />
                    </div>
                </div>

                {/* Specs Group */}
                <div className={styles.group}>
                    <label className={styles.label}>Especificaciones</label>
                    <div className={styles.row2}>
                        <Select
                            value={draft.strength}
                            onChange={handleStrength}
                            variant="light"
                        >
                            {STRENGTHS.map(s => (
                                <option key={s} value={s}>f'c {s}</option>
                            ))}
                        </Select>
                        <Select
                            value={draft.type}
                            onChange={handleType}
                            variant="light"
                        >
                            {CONCRETE_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </Select>
                    </div>
                </div>
            </div>

            {/* Results Bar */}
            <div className={styles.resultsBar}>
                <div className={styles.resultInfo}>
                    <span className={styles.volLabel}>Volumen:</span>
                    <span className={styles.volValue}>{quote.volume.billedM3.toFixed(1)} m³</span>
                </div>
                <div className={styles.priceInfo}>
                    <span className={styles.priceLabel}>Total Estimado:</span>
                    <span className={styles.priceValue}>{fmtMXN(quote.total)}</span>
                </div>
            </div>

            <Button
                fullWidth
                onClick={handleAdd}
                disabled={!isValid}
                className={styles.addBtn}
            >
                Agregar al Pedido <span>+</span>
            </Button>
        </div>
    );
}

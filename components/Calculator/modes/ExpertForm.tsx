// components/Calculator/modes/ExpertForm.tsx
'use client';

import { useCalculatorState } from '../hooks/useCalculatorState';
import { useQuoteCalculator } from '../../../hooks/useQuoteCalculator';
import { useCejStore } from '@/store/useCejStore';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { STRENGTHS, CONCRETE_TYPES } from '@/config/business';
import { type Strength, type ConcreteType } from '../types';
import { fmtMXN } from '@/lib/utils';
import styles from './ExpertForm.module.scss';

export default function ExpertForm() {
    // 1. Hooks for State & Logic
    const {
        length, setLength,
        width, setWidth,
        thicknessByDims, setThicknessByDims,
        strength, setStrength,
        type, setType,
        resetCalculator
    } = useCalculatorState();

    const { quote, isValid } = useQuoteCalculator();
    const addToCart = useCejStore(s => s.addToCart);

    // 2. Handlers
    const handleAdd = () => {
        if (isValid) {
            addToCart(quote);
        }
    };

    return (
        <div className={styles.expertContainer}>
            <header className={styles.header}>
                <h2 className={styles.title}>Cálculo Rápido</h2>
                <button type="button" onClick={resetCalculator} className={styles.resetBtn}>
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
                            value={length}
                            onChange={(e) => setLength(e.target.value)}
                            variant="light"
                        />
                        <Input
                            placeholder="Ancho"
                            type="number"
                            value={width}
                            onChange={(e) => setWidth(e.target.value)}
                            variant="light"
                        />
                        <Input
                            placeholder="Grosor (cm)"
                            type="number"
                            value={thicknessByDims}
                            onChange={(e) => setThicknessByDims(e.target.value)}
                            variant="light"
                        />
                    </div>
                </div>

                {/* Specs Group */}
                <div className={styles.group}>
                    <label className={styles.label}>Especificaciones</label>
                    <div className={styles.row2}>
                        <Select
                            value={strength}
                            onChange={(e) => setStrength(e.target.value as Strength)}
                            variant="light"
                        >
                            {STRENGTHS.map(s => (
                                <option key={s} value={s}>f'c {s}</option>
                            ))}
                        </Select>
                        <Select
                            value={type}
                            onChange={(e) => setType(e.target.value as ConcreteType)}
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

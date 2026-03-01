'use client';

import { useState } from 'react';
import { PricingRules, Additive, VolumeTier } from '@/lib/schemas/pricing';
import { updatePriceConfig } from '@/app/actions/updatePriceConfig';
import styles from './PricingManagement.module.scss';

interface PricingEditorProps {
    initialRules: PricingRules;
}

export function PricingEditor({ initialRules }: PricingEditorProps) {
    const [rules, setRules] = useState<PricingRules>(initialRules);
    const [activeTab, setActiveTab] = useState<'base' | 'additives' | 'global'>('base');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            const result = await updatePriceConfig(rules);
            if (result.status === 'success') {
                setMessage({ type: 'success', text: `Configuración guardada exitosamente (v${result.version}).` });
                setRules({ ...rules, version: result.version });
            } else {
                setMessage({ type: 'error', text: result.message });
            }
        } catch {
            setMessage({ type: 'error', text: 'Error de conexión al servidor.' });
        } finally {
            setIsSaving(false);
        }
    };

    const updateBasePrice = (type: string, strength: string, index: number, field: keyof VolumeTier, value: number) => {
        const newRules = { ...rules };
        const tierSource = newRules.base[type as keyof typeof newRules.base];
        if (!tierSource) return;
        const strengthKey = strength as keyof typeof tierSource;
        const tiers = tierSource[strengthKey];
        if (!tiers) return;
        (tiers[index] as Record<string, unknown>)[field] = value;
        setRules(newRules);
    };

    const updateAdditive = <K extends keyof Additive>(id: string, field: K, value: Additive[K]) => {
        const newRules = { ...rules };
        const additive = newRules.additives.find(a => a.id === id);
        if (additive) {
            (additive as Record<string, unknown>)[field] = value;
            setRules(newRules);
        }
    };

    const updateGlobal = <K extends keyof PricingRules>(field: K, value: PricingRules[K]) => {
        setRules({ ...rules, [field]: value });
    };

    return (
        <div className={styles.editor}>
            <div className={styles.tabs}>
                <button
                    className={activeTab === 'base' ? styles.active : ''}
                    onClick={() => setActiveTab('base')}
                >
                    Precios Base
                </button>
                <button
                    className={activeTab === 'additives' ? styles.active : ''}
                    onClick={() => setActiveTab('additives')}
                >
                    Aditivos
                </button>
                <button
                    className={activeTab === 'global' ? styles.active : ''}
                    onClick={() => setActiveTab('global')}
                >
                    Global
                </button>
            </div>

            <div className={styles.glassCard}>
                {activeTab === 'base' && (
                    <div className={styles.tabContent}>
                        <h2 className={styles.sectionTitle}>💰 Precios por Resistencia y Entrega</h2>
                        <div className={styles.grid}>
                            {Object.entries(rules.base).map(([type, strengths]) => (
                                <div key={type} className={styles.typeSection}>
                                    <h3 className={styles.typeTitle}>{type === 'direct' ? 'Entrega Directa' : 'Con Bomba'}</h3>
                                    {Object.entries(strengths).map(([strength, tiers]) => (
                                        <div key={strength} className={styles.strengthGroup}>
                                            <h4>f&apos;c {strength}</h4>
                                            {tiers.map((tier, idx) => (
                                                <div key={idx} className={styles.tierCard}>
                                                    <label>Desde {tier.minM3} m³</label>
                                                    <input
                                                        type="number"
                                                        value={tier.pricePerM3Cents / 100}
                                                        onChange={(e) => updateBasePrice(type, strength, idx, 'pricePerM3Cents', parseFloat(e.target.value) * 100)}
                                                    />
                                                    <span className={styles.unit}>MXN / m³</span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'additives' && (
                    <div className={styles.tabContent}>
                        <h2 className={styles.sectionTitle}>🧪 Catálogo de Aditivos</h2>
                        <div className={styles.additivesTable}>
                            <div className={styles.tableHeader}>
                                <span>Nombre</span>
                                <span>Modelo</span>
                                <span>Precio (MXN)</span>
                                <span>Estado</span>
                            </div>
                            {rules.additives.map((additive) => (
                                <div key={additive.id} className={styles.additiveRow}>
                                    <div className={styles.additiveInfo}>
                                        <strong>{additive.label}</strong>
                                        <p>{additive.description}</p>
                                    </div>
                                    <select
                                        value={additive.pricingModel}
                                        onChange={(e) => updateAdditive(additive.id, 'pricingModel', e.target.value as 'per_m3' | 'fixed_per_load')}
                                    >
                                        <option value="per_m3">Por m³</option>
                                        <option value="fixed_per_load">Fijo por viaje</option>
                                    </select>
                                    <input
                                        type="number"
                                        value={additive.priceCents / 100}
                                        onChange={(e) => updateAdditive(additive.id, 'priceCents', parseFloat(e.target.value) * 100)}
                                    />
                                    <button
                                        className={`${styles.badge} ${additive.active ? styles.active : styles.inactive}`}
                                        onClick={() => updateAdditive(additive.id, 'active', !additive.active)}
                                    >
                                        {additive.active ? 'Activo' : 'Inactivo'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'global' && (
                    <div className={styles.tabContent}>
                        <h2 className={styles.sectionTitle}>🌍 Configuración General</h2>
                        <div className={styles.grid}>
                            <div className={styles.tierCard}>
                                <label>Tasa de IVA (0.16 = 16%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={rules.vatRate}
                                    onChange={(e) => updateGlobal('vatRate', parseFloat(e.target.value))}
                                />
                            </div>
                            <div className={styles.tierCard}>
                                <label>Mínimo Directo (m³)</label>
                                <input
                                    type="number"
                                    value={rules.minOrderQuantity.direct}
                                    onChange={(e) => updateGlobal('minOrderQuantity', { ...rules.minOrderQuantity, direct: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className={styles.tierCard}>
                                <label>Mínimo Bomba (m³)</label>
                                <input
                                    type="number"
                                    value={rules.minOrderQuantity.pumped}
                                    onChange={(e) => updateGlobal('minOrderQuantity', { ...rules.minOrderQuantity, pumped: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <footer className={styles.footer}>
                {message && (
                    <div className={`${styles.message} ${styles[message.type]}`}>
                        {message.text}
                    </div>
                )}
                <button
                    className={styles.saveButton}
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'Guardando...' : 'Publicar Cambios'}
                </button>
            </footer>
        </div>
    );
}

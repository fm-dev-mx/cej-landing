'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { calcQuote, Strength, ConcreteType, Zone } from '@/lib/pricing';
import { clamp, fmtMXN, parseNum } from '@/lib/utils';
import { trackLead, trackViewContent, trackContact } from '@/lib/pixel';
import styles from './Calculator.module.scss';

const STRENGTHS: Strength[] = ['150', '200', '250', '300', '350'];
const TYPES: ConcreteType[] = ['convencional', 'bombeado', 'fibra'];
const ZONES: Zone[] = ['urbana', 'periferia'];

export default function Calculator() {
  // ---- State
  const [m3, setM3] = useState<string>('6');
  const [strength, setStrength] = useState<Strength>('200');
  const [type, setType] = useState<ConcreteType>('convencional');
  const [zone, setZone] = useState<Zone>('urbana');

  // ---- Derived values
  const m3Num = useMemo(() => clamp(parseNum(m3), 1, 200), [m3]);
  const quote = useMemo(
    () => calcQuote(m3Num, strength, type, zone),
    [m3Num, strength, type, zone]
  );

  // Track every recompute of total as a ViewContent
  useEffect(() => { trackViewContent(quote.total); }, [quote.total]);

  // ---- Handlers
  const onM3Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitimos solo números (el min ya protege, pero así evitamos NaN visuales)
    setM3(e.target.value.replace(/[^\d]/g, ''));
  }, []);

  const onStrengthChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setStrength(e.target.value as Strength);
  }, []);

  const onTypeClick = useCallback((t: ConcreteType) => setType(t), []);
  const onZoneClick = useCallback((z: Zone) => setZone(z), []);

  // ---- WhatsApp + Tel
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';
  const phone = process.env.NEXT_PUBLIC_PHONE ?? '';
  const waDisabled = waNumber.trim().length === 0;

  const whatsappText = useMemo(
    () =>
      encodeURIComponent(
        `Cotización CEJ\n` +
          `m³: ${m3Num}\n` +
          `f’c: ${strength}\n` +
          `Tipo: ${type}\n` +
          `Zona: ${zone}\n` +
          `Base: ${fmtMXN(quote.base)}\n` +
          `Extras: ${fmtMXN(quote.extras)}\n` +
          `Flete: ${fmtMXN(quote.freight)}\n` +
          `IVA: ${fmtMXN(quote.vat)}\n` +
          `Total: ${fmtMXN(quote.total)}`
      ),
    [m3Num, strength, type, zone, quote]
  );

  const onWhatsAppClick = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      if (waDisabled) {
        e?.preventDefault();
        return;
      }
      trackLead(quote.total);
      window.open(
        `https://wa.me/${waNumber}?text=${whatsappText}`,
        '_blank',
        'noopener,noreferrer'
      );
    },
    [waDisabled, waNumber, whatsappText, quote.total]
  );

  const onPhoneClick = useCallback(() => {
    if (phone.trim()) trackContact(quote.total);
  }, [phone, quote.total]);

  // ---- Render
  return (
    <section className={styles.wrapper}>
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        {/* Volumen */}
        <div className={styles.field}>
          <label htmlFor="vol">Volumen (m³)</label>
          <input
            id="vol"
            type="number"
            min={1}
            value={m3}
            onChange={onM3Change}
            className={styles.control}
            aria-describedby="vol-hint"
            inputMode="numeric"
          />
          <p id="vol-hint" className="hint">Ingresa solo números enteros.</p>
        </div>

        {/* Resistencia */}
        <div className={styles.field}>
          <label htmlFor="fck">Resistencia (f’c)</label>
          <select
            id="fck"
            value={strength}
            onChange={onStrengthChange}
            className={`${styles.control} ${styles.select}`}
          >
            {STRENGTHS.map((s) => (
              <option key={s} value={s}>{s} kg/cm²</option>
            ))}
          </select>
        </div>

        {/* Tipo */}
        <div className={styles.field}>
          <label>Tipo</label>
          <div className={styles.radioGroup}>
            {TYPES.map((t) => (
              <label key={t} className={styles.radio}>
                <input
                  type="radio"
                  name="tipo"
                  value={t}
                  checked={type === t}
                  onChange={() => onTypeClick(t)}
                />
                <span>
                  {t === 'convencional' ? 'Convencional' : t === 'bombeado' ? 'Bombeado' : 'Con fibra'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Zona */}
        <div className={styles.field}>
          <label>Zona</label>
          <div className={styles.radioGroup}>
            {ZONES.map((z) => (
              <label key={z} className={styles.radio}>
                <input
                  type="radio"
                  name="zona"
                  value={z}
                  checked={zone === z}
                  onChange={() => onZoneClick(z)}
                />
                <span>{z === 'urbana' ? 'Urbana' : 'Periferia'}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Totales */}
        <aside className={styles.totalCard} aria-live="polite">
          <div className={styles.rows}>
            <div className={styles.row}><span className={styles.muted}>Base</span><strong className={styles.amount}>{fmtMXN(quote.base)}</strong></div>
            <div className={styles.row}><span className={styles.muted}>Extras</span><strong className={styles.amount}>{fmtMXN(quote.extras)}</strong></div>
            <div className={styles.row}><span className={styles.muted}>Flete</span><strong className={styles.amount}>{fmtMXN(quote.freight)}</strong></div>
            <div className={styles.row}><span className={styles.muted}>Subtotal</span><strong className={styles.amount}>{fmtMXN(quote.subtotal)}</strong></div>
            <div className={styles.row}><span className={styles.muted}>IVA 16%</span><strong className={styles.amount}>{fmtMXN(quote.vat)}</strong></div>
          </div>

          <div className={styles.row}>
            <span className={styles.grand}>Total</span>
            <span className={`${styles.grand} ${styles.amount}`}>{fmtMXN(quote.total)}</span>
          </div>

          {/* CTAs inline para ≥ md */}
          <div className={styles.actions} role="group" aria-label="Contactar a CEJ (desktop)">
            <button
              type="button"
              onClick={onWhatsAppClick}
              disabled={waDisabled}
              title={waDisabled ? 'Configura NEXT_PUBLIC_WHATSAPP_NUMBER' : 'Abrir WhatsApp'}
            >
              💬 WhatsApp
            </button>

            <a
              className="secondary"
              href={`tel:+${phone}`}
              onClick={onPhoneClick}
              title="Llamar por teléfono"
            >
              📞 Llamar
            </a>
          </div>
        </aside>
      </form>
    </section>
  );
}

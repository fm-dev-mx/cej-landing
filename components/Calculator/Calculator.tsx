'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { calcQuote, Strength, ConcreteType, Zone } from '@/lib/pricing';
import { clamp, fmtMXN, parseNum } from '@/lib/utils';
import { trackLead, trackViewContent, trackContact } from '@/lib/pixel';
import styles from './calculator.module.scss';

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
  useEffect(() => {
    trackViewContent(quote.total);
  }, [quote.total]);

  // ---- Handlers (typed)
  const onStrengthChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setStrength(e.target.value as Strength);
    },
    []
  );

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

  const onWhatsAppClick = useCallback(() => {
    if (waDisabled) return;
    trackLead(quote.total);
    // window.open(`https://wa.me/${waNumber}?text=${whatsappText}`, '_blank');
    window.open(`https://wa.me/${waNumber}?text=${whatsappText}`, '_blank', 'noopener,noreferrer');
  }, [waDisabled, waNumber, whatsappText, quote.total]);


  const onPhoneClick = useCallback(() => {
    if (phone.trim()) trackContact(quote.total);
  }, [phone, quote.total]);

  // ---- Render
  return (
    <section className={styles.wrap} aria-label="Calculadora de Concreto">
      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        {/* Volumen */}
        <div className={styles.row}>
          <label htmlFor="calc-volume">Volumen (m³)</label>

          <input
            id="calc-volume"
            inputMode="decimal"
            pattern="^\d+(\.\d{1,2})?$"
            minLength={1}
            maxLength={6}
            autoComplete="off"
            value={m3}
            onChange={(e) => setM3(e.target.value)}
            required
            aria-required
          />

        </div>

        {/* Resistencia */}
        <div className={styles.row}>
          <label htmlFor="calc-strength">Resistencia (f’c)</label>
          <select id="calc-strength" value={strength} onChange={onStrengthChange}>
            {STRENGTHS.map((s) => (
              <option key={s} value={s}>
                {s} kg/cm²
              </option>
            ))}
          </select>
        </div>

        {/* Tipo */}
        <fieldset className={styles.row}>
          <legend>Tipo</legend>
          <div className={styles.chips} aria-label="Tipo de concreto">
            {TYPES.map((t) => (
              <label key={t} className={t === type ? styles.active : ''}>
                <input
                  type="radio"
                  name="tipo"
                  value={t}
                  checked={t === type}
                  onChange={() => onTypeClick(t)}
                  className="sr-only"
                />
                {t}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Zona */}
        <fieldset className={styles.row}>
          <legend>Zona</legend>
          <div className={styles.chips} aria-label="Zona de concreto">
            {ZONES.map((z) => (
              <label key={z} className={z === zone ? styles.active : ''}>
                <input
                  type="radio"
                  name="zona"
                  value={z}
                  checked={z === zone}
                  onChange={() => onZoneClick(z)}
                  className="sr-only"
                />
                {z}
              </label>
            ))}
          </div>
        </fieldset>

      </form>

      {/* Totales */}
      <div className={styles.totals} role="region" aria-live="polite">
        <div>
          <span>Base</span>
          <strong>{fmtMXN(quote.base)}</strong>
        </div>
        <div>
          <span>Extras</span>
          <strong>{fmtMXN(quote.extras)}</strong>
        </div>
        <div>
          <span>Flete</span>
          <strong>{fmtMXN(quote.freight)}</strong>
        </div>
        <div className={styles.sub}>
          <span>Subtotal</span>
          <strong>{fmtMXN(quote.subtotal)}</strong>
        </div>
        <div>
          <span>IVA 16%</span>
          <strong>{fmtMXN(quote.vat)}</strong>
        </div>
        <div className={styles.total}>
          <span>Total</span>
          <strong>{fmtMXN(quote.total)}</strong>
        </div>
      </div>

      {/* CTAs */}
      <div className={styles.ctaBar /* renombrado recomendado en SCSS */}>
        <button
          type="button"
          className={styles.whatsapp}
          onClick={onWhatsAppClick}     // hace window.open(...)
          disabled={waDisabled}
        >
          WhatsApp
        </button>

        <a
          className={styles.phone}
          href={`tel:${phone}`}
          onClick={onPhoneClick}
        >
          Llamar
        </a>
      </div>
    </section>
  );
}

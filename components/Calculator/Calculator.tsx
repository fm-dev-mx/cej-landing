'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  calcQuote,
  calcVolumeFromArea,
  calcVolumeFromDimensions,
  EMPTY_QUOTE,
  Strength,
  ConcreteType,
} from '@/lib/pricing';
import { clamp, fmtMXN, parseNum } from '@/lib/utils';
import { trackLead, trackViewContent, trackContact } from '@/lib/pixel';
import styles from './Calculator.module.scss';

type CalculatorMode = 'knownM3' | 'assistM3';
type AssistVolumeMode = 'dimensions' | 'area';

type WorkTypeId =
  | 'slab'
  | 'lightInteriorFloor'
  | 'vehicleFloor'
  | 'footings'
  | 'walls';

type WorkTypeConfig = {
  id: WorkTypeId;
  label: string;
  description: string;
  recommendedStrength: Strength;
};

const STRENGTHS: Strength[] = ['100', '150', '200', '250', '300'];

const CONCRETE_TYPES: { value: ConcreteType; label: string }[] = [
  { value: 'direct', label: 'Tiro directo' },
  { value: 'pumped', label: 'Bombeado' },
];

const WORK_TYPES: WorkTypeConfig[] = [
  {
    id: 'slab',
    label: 'Losa',
    description: 'Azoteas y losas de entrepiso.',
    recommendedStrength: '200',
  },
  {
    id: 'lightInteriorFloor',
    label: 'Piso interior ligero',
    description: 'Habitaciones y áreas interiores sin vehículos.',
    recommendedStrength: '150',
  },
  {
    id: 'vehicleFloor',
    label: 'Piso exterior / vehículos',
    description: 'Cochera, patios de maniobras ligeros.',
    recommendedStrength: '200',
  },
  {
    id: 'footings',
    label: 'Cimientos / zapatas',
    description: 'Cimentaciones corridas y zapatas.',
    recommendedStrength: '200',
  },
  {
    id: 'walls',
    label: 'Muros / industrial pesado',
    description: 'Muros estructurales y cargas pesadas.',
    recommendedStrength: '250',
  },
];

const ESTIMATE_LEGEND =
  'Los resultados son estimados. Para confirmar el volumen y el precio final realizamos una visita de volumetría sin costo, una vez programado el pedido y con la obra lista para colar.';

export default function Calculator() {
  // ---- Mode
  const [mode, setMode] = useState<CalculatorMode>('knownM3');
  const [volumeMode, setVolumeMode] =
    useState<AssistVolumeMode>('dimensions');

  // ---- Shared state
  const [strength, setStrength] = useState<Strength>('200');
  const [type, setType] = useState<ConcreteType>('direct');

  // ---- Flow A: user already knows m3
  const [m3, setM3] = useState<string>('6');

  // ---- Flow B: user needs help with m3
  const [workType, setWorkType] = useState<WorkTypeId>('slab');

  const [length, setLength] = useState<string>(''); // m
  const [width, setWidth] = useState<string>(''); // m
  const [thicknessByDims, setThicknessByDims] = useState<string>('12'); // cm

  const [area, setArea] = useState<string>(''); // m²
  const [thicknessByArea, setThicknessByArea] = useState<string>('12'); // cm

  const [hasCoffered, setHasCoffered] = useState<'yes' | 'no'>('no');

  const {
    quote,
    requestedM3,
    billedM3,
    volumeError,
    volumeWarning,
  } = useMemo(() => {
    const empty = {
      quote: EMPTY_QUOTE,
      requestedM3: 0,
      billedM3: 0,
      volumeError: '' as string | null,
      volumeWarning: '' as string | null,
    };

    let rawRequested = 0;
    let error: string | null = null;

    if (mode === 'knownM3') {
      const parsed = clamp(parseNum(m3), 0, 500);
      rawRequested = parsed;

      if (!parsed) {
        error = 'Ingresa un volumen mayor a 0 m³.';
      }
    } else {
      const hasCofferedSlab = hasCoffered === 'yes';

      if (volumeMode === 'dimensions') {
        const lengthNum = clamp(parseNum(length), 0, 1000);
        const widthNum = clamp(parseNum(width), 0, 1000);
        const thicknessNum = clamp(parseNum(thicknessByDims), 0, 100);

        if (!lengthNum || !widthNum || !thicknessNum) {
          error =
            'Completa largo, ancho y grosor para poder calcular los m³.';
        } else {
          const volume = calcVolumeFromDimensions({
            lengthM: lengthNum,
            widthM: widthNum,
            thicknessCm: thicknessNum,
            hasCofferedSlab,
          });

          rawRequested = volume;

          if (!volume) {
            error = 'Verifica que las medidas sean mayores a 0.';
          }
        }
      } else {
        const areaNum = clamp(parseNum(area), 0, 20000);
        const thicknessNum = clamp(parseNum(thicknessByArea), 0, 100);

        if (!areaNum || !thicknessNum) {
          error = 'Completa área y grosor para poder calcular los m³.';
        } else {
          const volume = calcVolumeFromArea({
            areaM2: areaNum,
            thicknessCm: thicknessNum,
            hasCofferedSlab,
          });

          rawRequested = volume;

          if (!volume) {
            error = 'Verifica que las medidas sean mayores a 0.';
          }
        }
      }
    }

    if (error || rawRequested <= 0) {
      return {
        ...empty,
        volumeError: error,
        volumeWarning: null,
      };
    }

    const q = calcQuote(rawRequested, strength, type);
    const {
      requestedM3: normalizedRequested,
      billedM3: normalizedBilled,
      minM3ForType,
      roundedM3,
      isBelowMinimum,
    } = q.volume;

    let warning: string | null = null;

    if (isBelowMinimum) {
      warning = `El mínimo para este tipo de concreto es ${minM3ForType.toFixed(
        1,
      )} m³. La cotización se calcula sobre ${normalizedBilled.toFixed(
        1,
      )} m³.`;
    } else if (normalizedBilled !== normalizedRequested) {
      warning =
        `Por política, el volumen se redondea hacia arriba a múltiplos de 0.5 m³. ` +
        `Ingresaste aproximadamente ${normalizedRequested.toFixed(
          2,
        )} m³ y se está cotizando sobre ${normalizedBilled.toFixed(2)} m³.`;
    } else if (roundedM3 !== normalizedRequested) {
      warning =
        `El volumen se ajusta a múltiplos de 0.5 m³. Se está cotizando sobre ${normalizedBilled.toFixed(
          2,
        )} m³.`;
    }

    return {
      quote: q,
      requestedM3: normalizedRequested,
      billedM3: normalizedBilled,
      volumeError: null,
      volumeWarning: warning,
    };
  }, [
    mode,
    m3,
    volumeMode,
    length,
    width,
    thicknessByDims,
    area,
    thicknessByArea,
    hasCoffered,
    strength,
    type,
  ]);

  // Pixel tracking for quote recalculations
  useEffect(() => {
    if (quote.total > 0) {
      trackViewContent(quote.total);
    }
  }, [quote.total]);

  const handleNumericInput = useCallback(
    (setter: (value: string) => void) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/,/g, '.');
        const cleaned = raw.replace(/[^0-9.]/g, '');
        setter(cleaned);
      },
    [],
  );

  const onM3Change = handleNumericInput(setM3);
  const onLengthChange = handleNumericInput(setLength);
  const onWidthChange = handleNumericInput(setWidth);
  const onAreaChange = handleNumericInput(setArea);
  const onThicknessByDimsChange = handleNumericInput(setThicknessByDims);
  const onThicknessByAreaChange = handleNumericInput(setThicknessByArea);

  const onStrengthChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setStrength(e.target.value as Strength);
    },
    [],
  );

  const onTypeClick = useCallback(
    (value: ConcreteType) => setType(value),
    [],
  );

  const onModeChange = useCallback((newMode: CalculatorMode) => {
    setMode(newMode);
  }, []);

  const onVolumeModeChange = useCallback(
    (newMode: AssistVolumeMode) => {
      setVolumeMode(newMode);
    },
    [],
  );

  const onWorkTypeClick = useCallback((id: WorkTypeId) => {
    setWorkType(id);
    const cfg = WORK_TYPES.find((w) => w.id === id);
    if (cfg) {
      setStrength(cfg.recommendedStrength);
    }
  }, []);

  const onCofferedChange = useCallback((value: 'yes' | 'no') => {
    setHasCoffered(value);
  }, []);

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';
  const phone = process.env.NEXT_PUBLIC_PHONE ?? '';
  const waDisabled = waNumber.trim().length === 0;

  const unitPriceLabel = useMemo(
    () => fmtMXN(quote.unitPricePerM3),
    [quote.unitPricePerM3],
  );

  const whatsappText = useMemo(
    () =>
      encodeURIComponent(
        `Cotización CEJ\n` +
          `Modo: ${
            mode === 'knownM3'
              ? 'Ya sé cuántos m³ necesito'
              : 'Ayúdame a calcular los m³'
          }\n` +
          `Volumen cotizado: ${billedM3.toFixed(2)} m³\n` +
          `Precio por m³: ${unitPriceLabel}\n` +
          `f’c: ${strength} kg/cm²\n` +
          `Tipo: ${type === 'direct' ? 'Tiro directo' : 'Bombeado'}\n` +
          `Subtotal: ${fmtMXN(quote.subtotal)}\n` +
          `IVA 8%: ${fmtMXN(quote.vat)}\n` +
          `Total: ${fmtMXN(quote.total)}`,
      ),
    [mode, billedM3, unitPriceLabel, strength, type, quote],
  );

  const onWhatsAppClick = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      if (waDisabled) {
        e?.preventDefault();
        return;
      }
      if (quote.total > 0) {
        trackLead(quote.total);
      }
      window.open(
        `https://wa.me/${waNumber}?text=${whatsappText}`,
        '_blank',
        'noopener,noreferrer',
      );
    },
    [waDisabled, waNumber, whatsappText, quote.total],
  );

  const onPhoneClick = useCallback(() => {
    if (phone.trim() && quote.total > 0) {
      trackContact(quote.total);
    }
  }, [phone, quote.total]);

  return (
    <section className={styles.wrapper}>
      <form
        className={styles.form}
        onSubmit={(e) => e.preventDefault()}
      >
        {/* Mode selector */}
        <div className={styles.field}>
          <label>¿Cómo quieres cotizar?</label>
          <div className={styles.radioGroup}>
            <label className={styles.radio}>
              <input
                type="radio"
                name="calc-mode"
                value="knownM3"
                checked={mode === 'knownM3'}
                onChange={() => onModeChange('knownM3')}
              />
              <span>Ya sé cuántos m³ necesito</span>
            </label>
            <label className={styles.radio}>
              <input
                type="radio"
                name="calc-mode"
                value="assistM3"
                checked={mode === 'assistM3'}
                onChange={() => onModeChange('assistM3')}
              />
              <span>Ayúdame a calcular los m³</span>
            </label>
          </div>
        </div>

        {/* Flow A: user already knows the volume */}
        {mode === 'knownM3' && (
          <div className={styles.field}>
            <label htmlFor="vol-known">Volumen (m³)</label>
            <input
              id="vol-known"
              type="number"
              min={0}
              step={0.1}
              value={m3}
              onChange={onM3Change}
              className={styles.control}
              aria-describedby="vol-known-hint"
              inputMode="decimal"
            />
            <p id="vol-known-hint" className="hint">
              Puedes ingresar decimales; se cotiza redondeando hacia arriba
              a múltiplos de 0.5 m³ y respetando el mínimo por tipo de
              concreto.
            </p>
          </div>
        )}

        {/* Flow B: help user compute volume */}
        {mode === 'assistM3' && (
          <>
            {/* Step 1: work type */}
            <div className={styles.field}>
              <label>Tipo de obra</label>
              <div className={styles.radioGroup}>
                {WORK_TYPES.map((w) => (
                  <label key={w.id} className={styles.radio}>
                    <input
                      type="radio"
                      name="work-type"
                      value={w.id}
                      checked={workType === w.id}
                      onChange={() => onWorkTypeClick(w.id)}
                    />
                    <span>
                      <strong>{w.label}</strong>
                      <br />
                      <small>{w.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 2: volume mode */}
            <div className={styles.field}>
              <label>¿Cómo quieres calcular el volumen?</label>
              <div className={styles.radioGroup}>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    name="volume-mode"
                    value="dimensions"
                    checked={volumeMode === 'dimensions'}
                    onChange={() => onVolumeModeChange('dimensions')}
                  />
                  <span>Por largo × ancho</span>
                </label>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    name="volume-mode"
                    value="area"
                    checked={volumeMode === 'area'}
                    onChange={() => onVolumeModeChange('area')}
                  />
                  <span>Por m²</span>
                </label>
              </div>
            </div>

            {/* Dimensions mode */}
            {volumeMode === 'dimensions' && (
              <>
                <div className={styles.field}>
                  <label htmlFor="length">Largo (m)</label>
                  <input
                    id="length"
                    type="number"
                    min={0}
                    step={0.1}
                    value={length}
                    onChange={onLengthChange}
                    className={styles.control}
                    inputMode="decimal"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="width">Ancho (m)</label>
                  <input
                    id="width"
                    type="number"
                    min={0}
                    step={0.1}
                    value={width}
                    onChange={onWidthChange}
                    className={styles.control}
                    inputMode="decimal"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="thickness-dims">Grosor (cm)</label>
                  <input
                    id="thickness-dims"
                    type="number"
                    min={0}
                    step={0.5}
                    value={thicknessByDims}
                    onChange={onThicknessByDimsChange}
                    className={styles.control}
                    inputMode="decimal"
                  />
                </div>
              </>
            )}

            {/* Area mode */}
            {volumeMode === 'area' && (
              <>
                <div className={styles.field}>
                  <label htmlFor="area">Área (m²)</label>
                  <input
                    id="area"
                    type="number"
                    min={0}
                    step={0.1}
                    value={area}
                    onChange={onAreaChange}
                    className={styles.control}
                    inputMode="decimal"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="thickness-area">Grosor (cm)</label>
                  <input
                    id="thickness-area"
                    type="number"
                    min={0}
                    step={0.5}
                    value={thicknessByArea}
                    onChange={onThicknessByAreaChange}
                    className={styles.control}
                    inputMode="decimal"
                  />
                </div>
              </>
            )}

            {/* Casetón */}
            <div className={styles.field}>
              <label>¿La losa lleva casetón?</label>
              <div className={styles.radioGroup}>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    name="coffered"
                    value="no"
                    checked={hasCoffered === 'no'}
                    onChange={() => onCofferedChange('no')}
                  />
                  <span>No</span>
                </label>
                <label className={styles.radio}>
                  <input
                    type="radio"
                    name="coffered"
                    value="yes"
                    checked={hasCoffered === 'yes'}
                    onChange={() => onCofferedChange('yes')}
                  />
                  <span>Sí</span>
                </label>
              </div>
              <p className="hint">
                Aplicamos el factor de casetón según tu selección para
                estimar los m³.
              </p>
            </div>
          </>
        )}

        {/* Strength */}
        <div className={styles.field}>
          <label htmlFor="fck">Resistencia (f’c)</label>
          <select
            id="fck"
            value={strength}
            onChange={onStrengthChange}
            className={`${styles.control} ${styles.select}`}
          >
            {STRENGTHS.map((s) => (
              <option key={s} value={s}>
                {s} kg/cm²
              </option>
            ))}
          </select>
          {mode === 'assistM3' && (
            <p className="hint">
              La resistencia se sugiere según el tipo de obra, pero puedes
              ajustarla si tu ingeniero estructurista indica otra.
            </p>
          )}
        </div>

        {/* Concrete type */}
        <div className={styles.field}>
          <label>Tipo de concreto</label>
          <div className={styles.radioGroup}>
            {CONCRETE_TYPES.map((t) => (
              <label key={t.value} className={styles.radio}>
                <input
                  type="radio"
                  name="tipo"
                  value={t.value}
                  checked={type === t.value}
                  onChange={() => onTypeClick(t.value)}
                />
                <span>{t.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Volume info / errors */}
        {volumeError && (
          <p className={styles.error} role="alert">
            {volumeError}
          </p>
        )}

        {!volumeError && billedM3 > 0 && (
          <p className={styles.note}>
            Volumen cotizado:{' '}
            <strong>{billedM3.toFixed(2)} m³</strong>
            {requestedM3 > 0 &&
              requestedM3 !== billedM3 &&
              ` (a partir de ${requestedM3.toFixed(2)} m³ ingresados).`}
          </p>
        )}

        {!volumeError && volumeWarning && (
          <p className={styles.note}>{volumeWarning}</p>
        )}

        {/* Totals */}
        <aside
          className={styles.totalCard}
          aria-live="polite"
        >
          <div className={styles.row}>
            <span className={styles.muted}>Volumen</span>
            <strong className={styles.amount}>
              {billedM3.toFixed(2)} m³
            </strong>
            </div>
          <div className={styles.rows}>
            {/* Unit price and volume */}
            <div className={styles.row}>
              <span className={styles.muted}>Precio por m³</span>
              <strong className={styles.amount}>{unitPriceLabel}</strong>
            </div>

            {/* Money breakdown */}
            <div className={styles.row}>
              <span className={styles.muted}>Subtotal</span>
              <strong className={styles.amount}>
                {fmtMXN(quote.subtotal)}
              </strong>
            </div>
            <div className={styles.row}>
              <span className={styles.muted}>IVA 8%</span>
              <strong className={styles.amount}>
                {fmtMXN(quote.vat)}
              </strong>
            </div>
          </div>

          <div className={styles.row}>
            <span className={styles.grand}>Total</span>
            <span
              className={`${styles.grand} ${styles.amount}`}
            >
              {fmtMXN(quote.total)}
            </span>
          </div>

          {/* CTAs inline for ≥ md */}
          <div
            className={styles.actions}
            role="group"
            aria-label="Contactar a CEJ (desktop)"
          >
            <button
              type="button"
              onClick={onWhatsAppClick}
              disabled={waDisabled}
              title={
                waDisabled
                  ? 'Configura NEXT_PUBLIC_WHATSAPP_NUMBER'
                  : 'Abrir WhatsApp'
              }
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

        <p className={styles.disclaimer}>{ESTIMATE_LEGEND}</p>
      </form>
    </section>
  );
}

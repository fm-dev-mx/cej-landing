'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from 'react';
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
type Step = 1 | 2 | 3;

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

const STORAGE_KEY = 'cej_calculator_v1';

export default function Calculator() {
  // ---- Step / mode
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<CalculatorMode | null>(null);
  const [volumeMode, setVolumeMode] =
    useState<AssistVolumeMode>('dimensions');

  // ---- Shared state
  const [strength, setStrength] = useState<Strength>('200');
  const [type, setType] = useState<ConcreteType>('direct');

  // ---- Flow A: user already knows m3
  const [m3, setM3] = useState<string>('');

  // ---- Flow B: user needs help with m3
  const [workType, setWorkType] = useState<WorkTypeId>('slab');

  const [length, setLength] = useState<string>(''); // m
  const [width, setWidth] = useState<string>(''); // m
  const [thicknessByDims, setThicknessByDims] = useState<string>('12'); // cm

  const [area, setArea] = useState<string>(''); // m²
  const [thicknessByArea, setThicknessByArea] = useState<string>('12'); // cm

  const [hasCoffered, setHasCoffered] = useState<'yes' | 'no'>('no');

  // ---- Persist / restore from localStorage

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);

      if (saved.step === 2 || saved.step === 3) {
        setStep(saved.step as Step);
      }
      if (saved.mode === 'knownM3' || saved.mode === 'assistM3') {
        setMode(saved.mode);
      }
      if (typeof saved.m3 === 'string') setM3(saved.m3);
      if (saved.workType) setWorkType(saved.workType);
      if (saved.volumeMode === 'dimensions' || saved.volumeMode === 'area') {
        setVolumeMode(saved.volumeMode);
      }
      if (saved.length) setLength(saved.length);
      if (saved.width) setWidth(saved.width);
      if (saved.thicknessByDims) setThicknessByDims(saved.thicknessByDims);
      if (saved.area) setArea(saved.area);
      if (saved.thicknessByArea) setThicknessByArea(saved.thicknessByArea);
      if (saved.hasCoffered === 'yes' || saved.hasCoffered === 'no') {
        setHasCoffered(saved.hasCoffered);
      }
      if (saved.strength) setStrength(saved.strength);
      if (saved.type) setType(saved.type);
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload = {
      step,
      mode,
      m3,
      workType,
      volumeMode,
      length,
      width,
      thicknessByDims,
      area,
      thicknessByArea,
      hasCoffered,
      strength,
      type,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    step,
    mode,
    m3,
    workType,
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

  // ---- Quote calculation

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

    if (mode === null) {
      return {
        ...empty,
        volumeError: null,
        volumeWarning: null,
      };
    }

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

  const canProceedToSummary = !volumeError && billedM3 > 0;

  // ---- Pixel tracking

  useEffect(() => {
    if (quote.total > 0) {
      trackViewContent(quote.total);
    }
  }, [quote.total]);

  // ---- Handlers

  const handleNumericInput = useCallback(
    (setter: (value: string) => void) =>
      (e: ChangeEvent<HTMLInputElement>) => {
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
    (e: ChangeEvent<HTMLSelectElement>) => {
      setStrength(e.target.value as Strength);
    },
    [],
  );

  const onTypeClick = useCallback(
    (value: ConcreteType) => setType(value),
    [],
  );

  const onModeChange = useCallback(
    (newMode: CalculatorMode) => {
      setMode(newMode);
      setStep(2); // pasamos automáticamente al paso 2

      if (newMode === 'knownM3') {
        setLength('');
        setWidth('');
        setArea('');
      } else {
        setM3('');
      }
    },
    [],
  );

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

  const modeLabel = useMemo(() => {
    if (mode === 'knownM3') return 'Ya sé cuántos m³ necesito';
    if (mode === 'assistM3') return 'Ayúdame a calcular los m³';
    return 'Modo sin seleccionar';
  }, [mode]);

  const whatsappText = useMemo(
    () =>
      encodeURIComponent(
        `Cotización CEJ\n` +
          `Modo: ${modeLabel}\n` +
          `Volumen cotizado: ${billedM3.toFixed(2)} m³\n` +
          `Precio por m³: ${unitPriceLabel}\n` +
          `f’c: ${strength} kg/cm²\n` +
          `Tipo: ${type === 'direct' ? 'Tiro directo' : 'Bombeado'}\n` +
          `Subtotal: ${fmtMXN(quote.subtotal)}\n` +
          `IVA 8%: ${fmtMXN(quote.vat)}\n` +
          `Total: ${fmtMXN(quote.total)}`,
      ),
    [modeLabel, billedM3, unitPriceLabel, strength, type, quote],
  );

  const onWhatsAppClick = useCallback(
    (e?: MouseEvent<HTMLButtonElement>) => {
      if (waDisabled || quote.total <= 0) {
        e?.preventDefault();
        return;
      }
      trackLead(quote.total);
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

  // ---- Render

  return (
    <section className={styles.wrapper}>
      <form
        className={styles.form}
        onSubmit={(e) => e.preventDefault()}
      >
        {/* STEP 1: Mode selector */}
        {step === 1 && (
          <div className={`${styles.step} ${styles.stepAnimated}`}>
            <header className={styles.stepHeader}>
              <span className={styles.stepBadge}>1</span>
              <h2 className={styles.stepTitle}>¿Cómo quieres cotizar?</h2>
            </header>

            <div className={styles.stepBody}>
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
          </div>
        )}

        {/* STEP 2: Inputs */}
        {step === 2 && mode !== null && (
          <div className={`${styles.step} ${styles.stepAnimated}`}>
            <header className={styles.stepHeader}>
              <span className={styles.stepBadge}>2</span>
              <h2 className={styles.stepTitle}>
                {mode === 'knownM3'
                  ? 'Ingresa tu volumen y detalles del concreto'
                  : 'Cuéntanos de tu obra para estimar los m³'}
              </h2>
            </header>

            <div className={styles.stepBody}>
              {/* Flow A */}
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
                    Puedes ingresar decimales; se cotiza redondeando hacia
                    arriba a múltiplos de 0.5 m³ y respetando el mínimo por
                    tipo de concreto.
                  </p>
                </div>
              )}

              {/* Flow B */}
              {mode === 'assistM3' && (
                <>
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

                  <div className={styles.field}>
                    <label>¿Cómo quieres calcular el volumen?</label>
                    <div className={styles.radioGroup}>
                      <label className={styles.radio}>
                        <input
                          type="radio"
                          name="volume-mode"
                          value="dimensions"
                          checked={volumeMode === 'dimensions'}
                          onChange={() =>
                            onVolumeModeChange('dimensions')
                          }
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
                    La resistencia se sugiere según el tipo de obra, pero
                    puedes ajustarla si tu ingeniero estructurista indica otra.
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
                    ` (a partir de ${requestedM3.toFixed(
                      2,
                    )} m³ ingresados).`}
                </p>
              )}

              {!volumeError && volumeWarning && (
                <p className={styles.note}>{volumeWarning}</p>
              )}

              {/* Step controls */}
              <div className={styles.stepControls}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setStep(1)}
                >
                  Volver al paso 1
                </button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => setStep(3)}
                  disabled={!canProceedToSummary}
                >
                  Continuar a la cotización
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Totals and CTAs */}
        {step === 3 && mode !== null && (
          <div className={`${styles.step} ${styles.stepAnimated}`}>
            <header className={styles.stepHeader}>
              <span className={styles.stepBadge}>3</span>
              <h2 className={styles.stepTitle}>Tu cotización estimada</h2>
            </header>

            <div className={styles.stepBody}>
              <aside
                className={styles.totalCard}
                aria-live="polite"
              >
                <div className={styles.rows}>
                  <div className={styles.row}>
                    <span className={styles.muted}>Volumen</span>
                    <strong className={styles.amount}>
                      {billedM3.toFixed(2)} m³
                    </strong>
                  </div>
                  <div className={styles.row}>
                    <span className={styles.muted}>Precio por m³</span>
                    <strong className={styles.amount}>
                      {unitPriceLabel}
                    </strong>
                  </div>
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

                <div
                  className={styles.actions}
                  role="group"
                  aria-label="Contactar a CEJ (desktop)"
                >
                  <button
                    type="button"
                    onClick={onWhatsAppClick}
                    disabled={waDisabled || quote.total <= 0}
                    title={
                      waDisabled
                        ? 'Configura NEXT_PUBLIC_WHATSAPP_NUMBER'
                        : 'Abrir WhatsApp con tu cotización'
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

              {billedM3 === 0 && !volumeError && (
                <p className={styles.note}>
                  Completa los datos del paso anterior para ver la cotización.
                </p>
              )}

              <div className={styles.stepControls}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setStep(2)}
                >
                  Editar datos
                </button>
              </div>

              <p className={styles.disclaimer}>{ESTIMATE_LEGEND}</p>
            </div>
          </div>
        )}
      </form>
    </section>
  );
}

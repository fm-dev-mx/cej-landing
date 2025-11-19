// components/Calculator/Calculator.tsx

'use client';

import { useCallback, useMemo, type MouseEvent } from 'react';
import { fmtMXN } from '@/lib/utils';
import { trackLead, trackContact } from '@/lib/pixel';
import styles from './Calculator.module.scss';
import { useCalculatorState } from './hooks/useCalculatorState';
import { useCalculatorQuote } from './hooks/useCalculatorQuote';
import { Step1Mode } from './steps/Step1Mode';
import { Step2Inputs } from './steps/Step2Inputs';
import { Step3Specs } from './steps/Step3Specs';
import { Step4Summary } from './steps/Step4Summary';
import { ESTIMATE_LEGEND, type CalculatorMode, type WorkTypeId } from './types';

export default function Calculator() {
  // Destructure all state and setters from the custom hook
  const {
    step,
    mode,
    volumeMode,
    strength,
    type,
    m3,
    workType,
    length,
    width,
    thicknessByDims,
    area,
    thicknessByArea,
    hasCoffered,
    cofferedSize, // New state for coffered slab size
    setStep,
    setMode,
    setVolumeMode,
    setStrength,
    setType,
    setM3,
    setWorkType,
    setLength,
    setWidth,
    setThicknessByDims,
    setArea,
    setThicknessByArea,
    setHasCoffered,
    setCofferedSize, // New setter
  } = useCalculatorState();

  // Calculate the quote based on current state
  const {
    quote,
    requestedM3,
    billedM3,
    volumeError,
    volumeWarning,
    unitPriceLabel,
    modeLabel,
  } = useCalculatorQuote({
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
  });

  // Validation to allow proceeding from Step 2 to Step 3
  const canProceedToSpecs = !volumeError && billedM3 > 0;

  // Environment variables for contact info
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';
  const phone = process.env.NEXT_PUBLIC_PHONE ?? '';
  const waDisabled = waNumber.trim().length === 0;

  // Format the detail string for WhatsApp message regarding coffered slabs
  const cofferedDetail =
    hasCoffered === 'yes' && cofferedSize
      ? ` (Casetón ${cofferedSize}cm)`
      : hasCoffered === 'yes'
      ? ' (Aligerada)'
      : '';

  // Memoize the WhatsApp message to prevent recalculation on every render
  const whatsappText = useMemo(
    () =>
      encodeURIComponent(
        `Cotización CEJ\n` +
          `Modo: ${modeLabel}${cofferedDetail}\n` +
          `Volumen solicitado: ${requestedM3.toFixed(2)} m³\n` +
          `Volumen facturable: ${billedM3.toFixed(2)} m³\n` +
          `Precio por m³: ${unitPriceLabel}\n` +
          `f’c: ${strength} kg/cm²\n` +
          `Tipo: ${type === 'direct' ? 'Tiro directo' : 'Bombeado'}\n` +
          `Subtotal: ${fmtMXN(quote.subtotal)}\n` +
          `IVA 8%: ${fmtMXN(quote.vat)}\n` +
          `Total: ${fmtMXN(quote.total)}`
      ),
    [
      modeLabel,
      cofferedDetail,
      requestedM3,
      billedM3,
      unitPriceLabel,
      strength,
      type,
      quote.subtotal,
      quote.vat,
      quote.total,
    ]
  );

  // Handler for WhatsApp Click (Lead tracking)
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
        'noopener,noreferrer'
      );
    },
    [waDisabled, waNumber, whatsappText, quote.total]
  );

  // Handler for Phone Click (Contact tracking)
  const onPhoneClick = useCallback(() => {
    if (phone.trim() && quote.total > 0) {
      trackContact(quote.total);
    }
  }, [phone, quote.total]);

  // --- Navigation Handlers ---

  const handleModeChange = useCallback(
    (newMode: CalculatorMode) => {
      setMode(newMode);
      // If user knows the M3, skip work type selection and go to dimensions
      if (newMode === 'knownM3') {
        setStep(2);
      }
    },
    [setMode, setStep]
  );

  const handleWorkTypeSelect = useCallback(
    (id: WorkTypeId) => {
      setWorkType(id);
      // Once work type is selected, proceed to dimensions
      setStep(2);
    },
    [setWorkType, setStep]
  );

  return (
    <section
      id="calculator-section"
      className={styles.wrapper}
      aria-labelledby="calculator-heading"
    >
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerBadgeRow}>
            <div className={styles.stepPill}>
              <span className={styles.stepPillDot} />
              <span>{`Paso ${step} de 4`}</span>
            </div>
          </div>

          <h2 id="calculator-heading" className={styles.headerTitle}>
            Calcula tu <span className={styles.headerTitleAccent}>concreto</span>{' '}
            al instante.
          </h2>

          <p className={styles.headerSubtitle}>
            Calcula en segundos el concreto que necesitas.
            <br />
            La volumetría final se confirma en obra por nuestros técnicos.
          </p>
        </header>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          {/* STEP 1: Mode Selection (and Work Type if needed) */}
          {step === 1 && (
            <Step1Mode
              mode={mode}
              workType={workType}
              onModeChange={handleModeChange}
              onWorkTypeSelect={handleWorkTypeSelect}
            />
          )}

          {/* STEP 2: Volumetry Inputs (Dimensions/Area) */}
          {step === 2 && mode !== null && (
            <Step2Inputs
              mode={mode}
              volumeMode={volumeMode}
              m3={m3}
              workType={workType}
              length={length}
              width={width}
              thicknessByDims={thicknessByDims}
              area={area}
              thicknessByArea={thicknessByArea}
              hasCoffered={hasCoffered}
              cofferedSize={cofferedSize}
              // Feedback props
              requestedM3={requestedM3}
              billedM3={billedM3}
              volumeError={volumeError}
              volumeWarning={volumeWarning}
              // Navigation & Actions
              canProceedToSpecs={canProceedToSpecs}
              onBackToStep1={() => setStep(1)}
              onContinueToStep3={() => setStep(3)}
              // Field Handlers
              onM3Change={setM3}
              onLengthChange={setLength}
              onWidthChange={setWidth}
              onThicknessByDimsChange={setThicknessByDims}
              onAreaChange={setArea}
              onThicknessByAreaChange={setThicknessByArea}
              onVolumeModeChange={setVolumeMode}
              onHasCofferedChange={setHasCoffered}
              onCofferedSizeChange={setCofferedSize}
            />
          )}

          {/* STEP 3: Specifications (Strength & Type) */}
          {step === 3 && mode !== null && (
            <Step3Specs
              strength={strength}
              type={type}
              mode={mode}
              onStrengthChange={setStrength}
              onTypeChange={setType}
              onBack={() => setStep(2)}
              onContinue={() => setStep(4)}
            />
          )}

          {/* STEP 4: Summary & Quote */}
          {step === 4 && mode !== null && (
            <Step4Summary
              billedM3={billedM3}
              quote={quote}
              unitPriceLabel={unitPriceLabel}
              waDisabled={waDisabled}
              phone={phone}
              volumeError={volumeError}
              onWhatsAppClick={onWhatsAppClick}
              onPhoneClick={onPhoneClick}
              onEditClick={() => setStep(3)}
              estimateLegend={ESTIMATE_LEGEND}
            />
          )}
        </form>
      </div>
    </section>
  );
}

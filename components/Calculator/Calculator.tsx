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
import { Step3Summary } from './steps/Step3Summary';
import { ESTIMATE_LEGEND } from './types';

export default function Calculator() {
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
  } = useCalculatorState();

  const {
    quote,
    requestedM3,
    billedM3,
    volumeError,
    volumeWarning,
    canProceedToSummary,
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

  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';
  const phone = process.env.NEXT_PUBLIC_PHONE ?? '';
  const waDisabled = waNumber.trim().length === 0;

  const whatsappText = useMemo(
    () =>
      encodeURIComponent(
        `Cotización CEJ\n` +
          `Modo: ${modeLabel}\n` +
          `Volumen solicitado: ${requestedM3.toFixed(2)} m³\n` +
          `Volumen facturable: ${billedM3.toFixed(2)} m³\n` +
          `Precio por m³: ${unitPriceLabel}\n` +
          `f’c: ${strength} kg/cm²\n` +
          `Tipo: ${type === 'direct' ? 'Tiro directo' : 'Bombeado'}\n` +
          `Subtotal: ${fmtMXN(quote.subtotal)}\n` +
          `IVA 8%: ${fmtMXN(quote.vat)}\n` +
          `Total: ${fmtMXN(quote.total)}`,
      ),
    [
      modeLabel,
      requestedM3,
      billedM3,
      unitPriceLabel,
      strength,
      type,
      quote.subtotal,
      quote.vat,
      quote.total,
    ],
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
              <span>{`Paso ${step} de 3`}</span>
            </div>
          </div>

          <h2 id="calculator-heading" className={styles.headerTitle}>
            Calcula tu{' '}
            <span className={styles.headerTitleAccent}>
              concreto
            </span>{' '}
            al instante.
          </h2>

          <p className={styles.headerSubtitle}>
            Calcula en segundos el concreto que necesitas.<br />
            La volumetría final se confirma en obra por nuestros técnicos.
          </p>

        </header>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          {step === 1 && (
            <Step1Mode mode={mode} onModeChange={setMode} />
          )}

          {step === 2 && mode !== null && (
            <Step2Inputs
              mode={mode}
              volumeMode={volumeMode}
              strength={strength}
              type={type}
              m3={m3}
              workType={workType}
              length={length}
              width={width}
              thicknessByDims={thicknessByDims}
              area={area}
              thicknessByArea={thicknessByArea}
              hasCoffered={hasCoffered}
              requestedM3={requestedM3}
              billedM3={billedM3}
              volumeError={volumeError}
              volumeWarning={volumeWarning}
              canProceedToSummary={canProceedToSummary}
              onBackToStep1={() => setStep(1)}
              onContinueToStep3={() => setStep(3)}
              onM3Change={setM3}
              onLengthChange={setLength}
              onWidthChange={setWidth}
              onThicknessByDimsChange={setThicknessByDims}
              onAreaChange={setArea}
              onThicknessByAreaChange={setThicknessByArea}
              onVolumeModeChange={setVolumeMode}
              onWorkTypeChange={setWorkType}
              onStrengthChange={setStrength}
              onTypeChange={setType}
              onHasCofferedChange={setHasCoffered}
            />
          )}

          {step === 3 && mode !== null && (
            <Step3Summary
              billedM3={billedM3}
              quote={quote}
              unitPriceLabel={unitPriceLabel}
              waDisabled={waDisabled}
              phone={phone}
              volumeError={volumeError}
              onWhatsAppClick={onWhatsAppClick}
              onPhoneClick={onPhoneClick}
              onEditClick={() => setStep(2)}
              estimateLegend={ESTIMATE_LEGEND}
            />
          )}
        </form>
      </div>
    </section>
  );
}

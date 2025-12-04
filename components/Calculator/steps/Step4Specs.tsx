// components/Calculator/steps/Step4Specs.tsx
'use client';

import { useCalculatorContext } from "../context/CalculatorContext";
import { Button } from "@/components/ui/Button/Button";
import { SpecsForm } from "./forms/SpecsForm";
import styles from "../Calculator.module.scss";

export function Step4Specs() {
  const {
    setStep,
    isCalculating,
    simulateCalculation
  } = useCalculatorContext();

  const handleCalculate = () => {
    simulateCalculation(() => {
      setStep(5);
    });
  };

  return (
    <div className={`${styles.step} ${styles.stepAnimated}`}>
      <header className={styles.stepHeader}>
        <h2 className={styles.stepTitle}>Especificaciones del Concreto</h2>
      </header>

      <div className={styles.stepBody}>
        <SpecsForm />

        <div className={styles.stepControls}>
          <Button
            variant="tertiary"
            onClick={() => setStep(3)}
            disabled={isCalculating}
          >
            Atrás
          </Button>
          <Button
            variant="primary"
            onClick={handleCalculate}
            isLoading={isCalculating}
            loadingText="Calculando..."
            disabled={isCalculating}
          >
            Ver Cotización Final
          </Button>
        </div>
      </div>
    </div>
  );
}

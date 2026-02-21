'use client';

import { CalculatorProvider, useCalculatorContext } from '../context/CalculatorContext';
import { Step1Mode } from '../steps/Step1Mode';
import { Step2WorkType } from '../steps/Step2WorkType';
import { Step3Inputs } from '../steps/Step3Inputs';
import { Step4Specs } from '../steps/Step4Specs';
import { Step5Summary } from '../steps/Step5Summary';
import { ESTIMATE_LEGEND } from '@/config/business';
import styles from '../Calculator.module.scss'; // Reuse existing styles

function WizardContent() {
    const { step, mode } = useCalculatorContext();

    // Map internal steps to components
    // Note: We reuse the exact same components from the Landing!
    return (
        <div className={styles.shell} style={{ boxShadow: 'none', background: 'transparent', border: 'none', padding: 0 }}>
            {step === 1 && <Step1Mode />}
            {step === 2 && mode === 'assistM3' && <Step2WorkType />}
            {step === 3 && mode !== null && <Step3Inputs />}
            {step === 4 && mode !== null && <Step4Specs />}
            {step === 5 && mode !== null && <Step5Summary estimateLegend={ESTIMATE_LEGEND} />}
        </div>
    );
}

export default function WizardAdapter() {
    return (
        <CalculatorProvider>
            <WizardContent />
        </CalculatorProvider>
    );
}

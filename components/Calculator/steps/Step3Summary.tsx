// components/Calculator/steps/Step3Summary.tsx

import type { MouseEvent } from 'react';
import { fmtMXN } from '@/lib/utils';
import type { QuoteBreakdown } from '../types';
import styles from '../Calculator.module.scss';

type Props = {
  billedM3: number;
  quote: QuoteBreakdown;
  unitPriceLabel: string;
  waDisabled: boolean;
  phone: string;
  volumeError: string | null;
  onWhatsAppClick: (e?: MouseEvent<HTMLButtonElement>) => void;
  onPhoneClick: () => void;
  onEditClick: () => void;
  estimateLegend: string;
};

export function Step3Summary(props: Props) {
  const {
    billedM3,
    quote,
    unitPriceLabel,
    waDisabled,
    phone,
    volumeError,
    onWhatsAppClick,
    onPhoneClick,
    onEditClick,
    estimateLegend,
  } = props;

  return (
    <div className={`${styles.step} ${styles.stepAnimated}`}>
      <header className={styles.stepHeader}>
        <span className={styles.stepBadge}>3</span>
        <h2 className={styles.stepTitle}>Tu cotización estimada</h2>
      </header>

      <div className={styles.stepBody}>
        <aside className={styles.totalCard} aria-live="polite">
          <div className={styles.rows}>
            <div className={styles.row}>
              <span className={styles.muted}>Volumen</span>
              <strong className={styles.amount}>
                {billedM3.toFixed(2)} m³
              </strong>
            </div>
            <div className={styles.row}>
              <span className={styles.muted}>Precio por m³</span>
              <strong className={styles.amount}>{unitPriceLabel}</strong>
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
            <span className={`${styles.grand} ${styles.amount}`}>
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
            onClick={onEditClick}
          >
            Editar datos
          </button>
        </div>

        <p className={styles.disclaimer}>{estimateLegend}</p>
      </div>
    </div>
  );
}

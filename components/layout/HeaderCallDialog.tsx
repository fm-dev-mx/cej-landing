// components/layout/HeaderCallDialog.tsx
import styles from "./Header.module.scss";

type HeaderCallDialogProps = {
  isOpen: boolean;
  phoneHref: string | null;
  phoneDisplay: string;
  onClose: () => void;
};

export function HeaderCallDialog({
  isOpen,
  phoneHref,
  phoneDisplay,
  onClose,
}: HeaderCallDialogProps) {
  if (!isOpen || !phoneHref) return null;

  return (
    <div className={styles.callDialogOverlay} onClick={onClose}>
      <div
        className={styles.callDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="call-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.callDialogHeader}>
          <h2 id="call-dialog-title" className={styles.callDialogTitle}>
            Llamar a Concreto y Equipos de Juárez
          </h2>
          <button
            type="button"
            className={styles.callDialogCloseIcon}
            aria-label="Cerrar"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p className={styles.callDialogSubtitle}>
          Marca para cotizar tu obra o resolver dudas sobre entregas y
          resistencias.
        </p>

        <div className={styles.callDialogPhoneBlock}>
          <a href={phoneHref} className={styles.callDialogPhoneLink}>
            <span className={styles.callDialogPhoneLabel}>Teléfono</span>
            <span className={styles.callDialogPhoneNumber}>
              {phoneDisplay}
            </span>
          </a>
          <p className={styles.callDialogHint}>
            Si estás en un teléfono, toca el número para iniciar la llamada.
          </p>
        </div>

        <div className={styles.callDialogActions}>
          <button
            type="button"
            className={styles.callDialogCloseButton}
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

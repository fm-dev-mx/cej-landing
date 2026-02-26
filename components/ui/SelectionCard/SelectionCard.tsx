// components/ui/SelectionCard/SelectionCard.tsx
import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import styles from './SelectionCard.module.scss';

interface SelectionCardProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  icon?: ReactNode;
  customIndicator?: ReactNode; // Icon replacing the circle
  isSelected?: boolean;
}

export const SelectionCard = forwardRef<HTMLInputElement, SelectionCardProps>(
  ({ className, label, description, icon, customIndicator, isSelected, id, ...props }, ref) => {
    return (
      <label
        className={`${styles.card} ${isSelected ? styles.selected : ''} ${className || ''}`}
        htmlFor={id}
        // Ensure screen readers understand this container is part of a selection
        aria-hidden="false"
      >
        <div className={styles.inputWrapper}>
          {/* ACCESSIBILITY NOTE:
            The input is visually hidden via SCSS mixins (clip-path) but remains
            in the DOM to handle focus and keyboard interaction.
            'checked' attribute handles the aria-checked state implicitly for radio inputs.
          */}
          <input
            ref={ref}
            id={id}
            type="radio"
            className={styles.input}
            checked={isSelected}
            {...props}
          />

          {/* Visual Indicator (Decorative) - hidden from screen readers to avoid noise */}
          {customIndicator ? (
            <div className={styles.customIndicatorWrapper} aria-hidden="true">
              {customIndicator}
            </div>
          ) : (
            <div className={styles.radioIndicator} aria-hidden="true" />
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            {icon && <span className={styles.icon} aria-hidden="true">{icon}</span>}
            <span className={styles.label}>{label}</span>
          </div>
          {description && <p className={styles.description}>{description}</p>}
        </div>
      </label>
    );
  }
);

SelectionCard.displayName = 'SelectionCard';

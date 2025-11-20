// components/ui/SelectionCard/SelectionCard.tsx

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import styles from './SelectionCard.module.scss';

interface SelectionCardProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  icon?: ReactNode;
  isSelected?: boolean;
}

export const SelectionCard = forwardRef<HTMLInputElement, SelectionCardProps>(
  ({ className, label, description, icon, isSelected, id, ...props }, ref) => {
    return (
      <label
        className={`${styles.card} ${isSelected ? styles.selected : ''} ${className || ''}`}
        htmlFor={id}
      >
        <div className={styles.inputWrapper}>
          <input
            ref={ref}
            id={id}
            type="radio"
            className={styles.input}
            checked={isSelected}
            {...props}
          />
          <div className={styles.radioIndicator} aria-hidden="true" />
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            {icon && <span className={styles.icon}>{icon}</span>}
            <span className={styles.label}>{label}</span>
          </div>
          {description && <p className={styles.description}>{description}</p>}
        </div>
      </label>
    );
  }
);

SelectionCard.displayName = 'SelectionCard';

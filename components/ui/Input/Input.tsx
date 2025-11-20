// components/ui/Input/Input.tsx
import { InputHTMLAttributes, forwardRef } from 'react';
import styles from './Input.module.scss';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  isVolume?: boolean;
  label?: string;
  variant?: 'dark' | 'light';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, isVolume, label, id, variant = 'dark', ...props }, ref) => {
    const containerClass = [
      styles.container,
      styles[variant]
    ].filter(Boolean).join(' ');

    const inputClasses = [
      styles.input,
      isVolume ? styles.volumeInput : '',
      className
    ]
      .filter(Boolean)
      .join(' ');

    // Si no hay label, renderizamos solo el input (comportamiento átomo)
    const inputElement = (
      <input
        ref={ref}
        id={id}
        className={inputClasses}
        {...props}
      />
    );

    if (!label) {
      return inputElement;
    }

    // Si hay label, renderizamos la molécula completa (Layout + Label + Input)
    return (
      <div className={containerClass}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {inputElement}
      </div>
    );
  }
);

Input.displayName = 'Input';

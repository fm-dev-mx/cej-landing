// components/ui/Select/Select.tsx
import { SelectHTMLAttributes, forwardRef } from 'react';
import styles from './Select.module.scss';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'dark' | 'light';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, variant = 'dark', ...props }, ref) => {
    // The input-style class is applied to the inner select
    const selectClass = [
      styles.select,
      styles[variant]
    ].filter(Boolean).join(' ');

    // The layout class passed from props is applied to the wrapper
    const wrapperClass = [
      styles.wrapper,
      className
    ].filter(Boolean).join(' ');

    return (
      <div className={wrapperClass}>
        <select ref={ref} className={selectClass} {...props}>
          {children}
        </select>
        <div className={`${styles.arrow} ${styles[variant]}`} aria-hidden="true" />
      </div>
    );
  }
);

Select.displayName = 'Select';

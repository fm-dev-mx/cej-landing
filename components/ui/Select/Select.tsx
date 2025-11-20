// components/ui/Select/Select.tsx
import { SelectHTMLAttributes, forwardRef } from 'react';
import styles from './Select.module.scss';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    const rootClassName = [styles.select, className].filter(Boolean).join(' ');

    return (
      <select ref={ref} className={rootClassName} {...props}>
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

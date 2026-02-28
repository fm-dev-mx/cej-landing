// components/ui/Select/Select.tsx
"use client";

import { useState, useRef, useEffect, KeyboardEvent, MouseEvent } from 'react';
import styles from './Select.module.scss';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectConfig {
  placeholder?: string;
  variant?: 'dark' | 'light';
  error?: boolean | string;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  value: string;
  onChange: (e: { target: { value: string; name?: string } }) => void;
  options: SelectOption[];
  config?: SelectConfig;
  className?: string;
  name?: string;
  'aria-labelledby'?: string;
}

export const Select = ({
  id,
  value,
  onChange,
  options,
  config,
  className,
  name,
  'aria-labelledby': ariaLabelledBy
}: SelectProps) => {
  const placeholder = config?.placeholder ?? "Selecciona...";
  const variant = config?.variant ?? 'dark';
  const error = config?.error;
  const disabled = config?.disabled;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);
  const hasError = Boolean(error);
  const errorMessage = typeof error === 'string' ? error : null;

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (newValue: string) => {
    if (disabled) return;
    onChange({ target: { value: newValue, name } });
  };

  const handleSelect = (optionValue: string) => {
    if (disabled) return;
    handleChange(optionValue);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        toggleOpen();
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        if (!options.length) return;
        const currentIndex = options.findIndex(opt => opt.value === value);
        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        const nextOption = options[nextIndex];
        if (nextOption && !nextOption.disabled) {
          handleChange(nextOption.value);
        }
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        if (!options.length) return;
        const items = options;
        const idx = items.findIndex(opt => opt.value === value);
        const prevIndex = idx > 0 ? idx - 1 : items.length - 1;
        const prevOption = items[prevIndex];
        if (prevOption && !prevOption.disabled) {
          handleChange(prevOption.value);
        }
        break;
    }
  };

  // Create a unique ID for the listbox to satisfy aria-controls
  const listboxId = id ? `${id}-listbox` : undefined;
  const errorId = id ? `${id}-error` : undefined;

  const wrapperClass = [
    styles.wrapper,
    className,
    hasError ? styles.hasError : '',
    disabled ? styles.disabled : ''
  ].filter(Boolean).join(' ');

  const triggerClass = [
    styles.trigger,
    styles[variant],
    isOpen ? styles.open : '',
    !selectedOption ? styles.placeholder : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass} ref={containerRef}>
      {/* Trigger Area */}
      <div
        className={triggerClass}
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        id={id}
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled}
        aria-labelledby={ariaLabelledBy}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
      >
        <span className={styles.label}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className={styles.arrowIcon} />
      </div>

      {/* Dropdown Menu */}
      <div className={`${styles.dropdown} ${isOpen ? styles.active : ''} ${styles[variant]}`}>
        {/* Dropdown list with options */}
        <ul role="listbox" id={listboxId} className={styles.optionsList}>
          {options.map((option) => (
            <li
              key={option.value}
              className={`${styles.option} ${option.value === value ? styles.selected : ''} ${option.disabled ? styles.disabledItem : ''}`}
              onClick={(e: MouseEvent) => {
                e.stopPropagation();
                if (!option.disabled) handleSelect(option.value);
              }}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled}
            >
              {option.label}
              {option.value === value && <span className={styles.checkIcon}>✓</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <span id={errorId} className={styles.errorMessage} role="alert">
          {errorMessage}
        </span>
      )}
    </div>
  );
};

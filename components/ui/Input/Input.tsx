import { InputHTMLAttributes, forwardRef, useId } from "react";
import styles from "./Input.module.scss";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  isVolume?: boolean;
  label?: string;
  variant?: "dark" | "light";
  error?: boolean | string;
  /** Visual unit suffix displayed inside the input (e.g., "m", "cm", "m²") */
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, isVolume, label, id, variant = "dark", error, suffix, ...props }, ref) => {
    // Generate a stable ID for label + error association
    const internalId = useId();
    const inputId = id || internalId;

    const hasError = Boolean(error);
    const errorMessage = typeof error === "string" ? error : null;
    const errorId = errorMessage ? `${inputId}-error` : undefined;

    // Merge any external aria-describedby with our error id
    const externalDescribedBy = props["aria-describedby"];
    const describedBy =
      [externalDescribedBy, errorId].filter(Boolean).join(" ") || undefined;

    const containerClass = [
      styles.container,
      styles[variant],
      hasError ? styles.hasError : "",
    ]
      .filter(Boolean)
      .join(" ");

    const wrapperClass = [
      styles.inputWrapper,
      styles[variant], // Critical: keep theme even when label is not rendered
      hasError ? styles.hasError : "",
    ]
      .filter(Boolean)
      .join(" ");

    const inputClasses = [
      styles.input,
      isVolume ? styles.volumeInput : "",
      suffix ? styles.hasSuffix : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const inputElement = (
      <div className={wrapperClass}>
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {suffix && (
          <span className={styles.suffix} aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
    );

    // Atom behavior (input only)
    if (!label && !errorMessage) return inputElement;

    // Molecule behavior (Layout + Label + Input + Error)
    return (
      <div className={containerClass}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}

        {inputElement}

        {errorMessage && (
          <span id={errorId} className={styles.errorMessage} role="alert">
            {errorMessage}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

import { forwardRef, useMemo } from "react";
import { Input } from "./Input";
import { formatPhone } from "@/lib/utils";
import styles from "./Input.module.scss";

interface PhoneInputProps extends React.ComponentPropsWithoutRef<typeof Input> {
  onValueChange?: (value: string) => void;
}

/**
 * PhoneInput
 * Specialized input for Mexican 10-digit phone numbers.
 * Features:
 * - Auto-formatting: "656 123 4567"
 * - Numeric keyboard (inputMode="tel")
 * - Digit-only character counter
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, onValueChange, ...props }, ref) => {
    const rawValue = useMemo(() => String(value || "").replace(/\D/g, "").slice(0, 10), [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const digits = input.replace(/\D/g, "").slice(0, 10);

      if (onValueChange) {
          onValueChange(digits);
      }

      if (onChange) {
          // Keep internal consistency by passing the formatted value back to the traditional onChange
          const formatted = formatPhone(digits);
          // Create a synthetic event or just let the parent handle the raw digits
          // Most parents in this project use raw state updates, so we'll pass formatted to match current expectation
          e.target.value = formatted;
          onChange(e);
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="tel"
        inputMode="tel"
        value={value}
        onChange={handleChange}
        maxLength={12} // 10 digits + 2 spaces
        customCharCount={rawValue.length}
        label={props.label || "Teléfono"}
        placeholder={props.placeholder || "656 123 4567"}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

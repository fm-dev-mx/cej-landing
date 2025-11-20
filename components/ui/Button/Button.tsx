// components/ui/Button/Button.tsx
import { ButtonHTMLAttributes, AnchorHTMLAttributes, forwardRef } from 'react';
import styles from './Button.module.scss';

type ButtonVariant = 'primary' | 'secondary' | 'whatsapp';

// Union type allowing props for either a button or an anchor
type ButtonProps = {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  href?: string;
  isLoading?: boolean;
} & Partial<ButtonHTMLAttributes<HTMLButtonElement> & AnchorHTMLAttributes<HTMLAnchorElement>>;

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ className, variant = 'primary', fullWidth, href, isLoading, children, disabled, ...props }, ref) => {
    const rootClassName = [
      styles.base,
      styles[variant],
      fullWidth ? styles.fullWidth : '',
      isLoading ? styles.loading : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const isDisabled = disabled || isLoading;

    // Render as Anchor if href is provided and not disabled
    if (href && !isDisabled) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={rootClassName}
          {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      );
    }

    // Render as Button otherwise
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={rootClassName}
        disabled={isDisabled}
        {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

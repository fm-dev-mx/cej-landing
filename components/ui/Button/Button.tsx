// components/ui/Button/Button.tsx
import { ButtonHTMLAttributes, AnchorHTMLAttributes, forwardRef } from 'react';
import styles from './Button.module.scss';

type ButtonVariant = 'primary' | 'secondary' | 'whatsapp';

// Union type allowing props for either a button or an anchor
type ButtonProps = {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  href?: string;
} & Partial<ButtonHTMLAttributes<HTMLButtonElement> & AnchorHTMLAttributes<HTMLAnchorElement>>;

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ className, variant = 'primary', fullWidth, href, children, ...props }, ref) => {
    const rootClassName = [
      styles.base,
      styles[variant],
      fullWidth ? styles.fullWidth : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // Render as Anchor if href is provided
    if (href) {
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
        {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

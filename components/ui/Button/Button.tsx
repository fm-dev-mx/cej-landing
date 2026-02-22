// components/ui/Button/Button.tsx
import { ButtonHTMLAttributes, AnchorHTMLAttributes, forwardRef } from 'react';
import { WhatsAppIcon } from '@/components/ui/Icon/WhatsAppIcon';
import styles from './Button.module.scss';

type ButtonVariant = 'primary' | 'secondary' | 'whatsapp' | 'tertiary';

// Union type allowing props for either a button or an anchor
type ButtonProps = {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  href?: string;
  isLoading?: boolean;
  loadingText?: string; // New prop for explicit feedback
} & Partial<ButtonHTMLAttributes<HTMLButtonElement> & AnchorHTMLAttributes<HTMLAnchorElement>>;

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  ({ className, variant = 'primary', fullWidth, href, isLoading, loadingText, children, disabled, ...props }, ref) => {
    const rootClassName = [
      styles.base,
      styles[variant],
      fullWidth ? styles.fullWidth : '',
      isLoading ? styles.loading : '',
      isLoading && loadingText ? styles.loadingWithText : '', // Conditional class for layout
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const isDisabled = disabled || isLoading;

    const content = isLoading ? (
      <>
        <span className={styles.spinner} aria-hidden="true" />
        {loadingText || (
          // If no loading text, keep original children (visually hidden by CSS if just spinner)
          <span className={styles.invisibleContent}>{children}</span>
        )}
      </>
    ) : (
      <>
        {variant === 'whatsapp' && <WhatsAppIcon size={20} className={styles.icon} />}
        {children}
      </>
    );

    // Render as Anchor if href is provided and not disabled
    if (href && !isDisabled) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={rootClassName}
          {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {content}
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
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

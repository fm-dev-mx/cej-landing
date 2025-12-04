// components/ui/Card/Card.tsx
import { HTMLAttributes, forwardRef, type ReactNode } from 'react';
import styles from './Card.module.scss';

type CardVariant = 'glass' | 'surface' | 'outline';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant;
    children: ReactNode;
}

const Root = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'surface', children, ...props }, ref) => {
        const variantClass = styles[`variant-${variant}`];

        return (
            <article
                ref={ref}
                className={`${styles.root} ${variantClass} ${className || ''}`}
                {...props}
            >
                {children}
            </article>
        );
    }
);
Root.displayName = 'Card.Root';

interface HeaderProps extends HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean;
}

const Header = forwardRef<HTMLDivElement, HeaderProps>(
    ({ className, noPadding, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`${styles.header} ${noPadding ? styles.noPadding : ''} ${className || ''}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);
Header.displayName = 'Card.Header';

const Body = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`${styles.body} ${className || ''}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);
Body.displayName = 'Card.Body';

const Footer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`${styles.footer} ${className || ''}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);
Footer.displayName = 'Card.Footer';

export const Card = {
    Root,
    Header,
    Body,
    Footer,
};

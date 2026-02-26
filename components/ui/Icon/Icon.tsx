import { ICON_REGISTRY } from './icon-registry';

interface IconProps {
    /** Key registered in ICON_REGISTRY */
    name: string;
    /** Size in px (default: 24) */
    size?: number;
    /** Additional CSS class */
    className?: string;
    /** If the icon has semantic meaning, provide an accessibility label */
    'aria-label'?: string;
}

export function Icon({
    name,
    size = 24,
    className,
    'aria-label': ariaLabel,
}: IconProps) {
    const fallback = ICON_REGISTRY.calculator;
    const LucideIcon =
        (ICON_REGISTRY as Record<string, typeof fallback>)[name] ?? fallback;

    return (
        <LucideIcon
            size={size}
            className={className}
            aria-hidden={!ariaLabel}
            aria-label={ariaLabel}
            role={ariaLabel ? 'img' : undefined}
        />
    );
}

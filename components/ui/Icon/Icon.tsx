import { ICON_REGISTRY, type IconName } from './icon-registry';

interface IconProps {
    /** Key registered in ICON_REGISTRY */
    name: IconName;
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
    const LucideIcon = ICON_REGISTRY[name];

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

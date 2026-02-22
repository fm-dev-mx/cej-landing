import type { LucideIcon } from 'lucide-react';
import {
    Clock,
    ShieldCheck,
    MapPin,
    Calculator,
    CalendarCheck,
    HardHat,
    Truck,
    Building,
    WavesArrowUp,
    ClipboardCheck,
} from 'lucide-react';

export const ICON_REGISTRY = {
    clock: Clock,
    'shield-check': ShieldCheck,
    'map-pin': MapPin,
    calculator: Calculator,
    'calendar-check': CalendarCheck,
    'hard-hat': HardHat,
    truck: Truck,
    building: Building,
    'waves-arrow-up': WavesArrowUp,
    'clipboard-check': ClipboardCheck,
} as const;

/** Union type of all valid icon registry keys */
export type IconName = keyof typeof ICON_REGISTRY;

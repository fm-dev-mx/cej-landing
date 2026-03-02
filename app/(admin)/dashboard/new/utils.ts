import type { PhoneCustomerMatch } from '@/app/actions/findCustomerByPhone';

export type QuickDateOption = 'today' | 'tomorrow' | 'plus2' | 'custom';

export const LOOKUP_DEBOUNCE_MS = 350;
export const CUTOFF_HOUR = 17;

export function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('52')) return digits;
    if (digits.length === 10) return `52${digits}`;
    return digits;
}

export function stripPhone(value: string): string {
    return value.replace(/\D/g, '');
}

export function formatPhone(value: string, isIntl: boolean): string {
    const digits = stripPhone(value);
    const inner = (d: string) => {
        let res = '';
        if (d.length > 0) res += `(${d.slice(0, 3)}`;
        if (d.length >= 4) res += `) ${d.slice(3, 6)}`;
        if (d.length >= 7) res += `-${d.slice(6, 10)}`;
        return res;
    };
    return isIntl ? `+1 ${inner(digits)}` : inner(digits);
}

export function toDateYmd(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function addDays(baseDate: Date, days: number): Date {
    const nextDate = new Date(baseDate);
    nextDate.setDate(baseDate.getDate() + days);
    return nextDate;
}

export function getDateFromQuickOption(option: Exclude<QuickDateOption, 'custom'>, now: Date): string {
    if (option === 'today') return toDateYmd(now);
    if (option === 'tomorrow') return toDateYmd(addDays(now, 1));
    return toDateYmd(addDays(now, 2));
}

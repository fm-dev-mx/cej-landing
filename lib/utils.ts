export const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export function fmtMXN(value: number) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}


export const parseNum = (s: string) => {
    const n = Number(String(s).replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : 0;
};

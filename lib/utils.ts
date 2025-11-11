export const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export const fmtMXN = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v);

export const parseNum = (s: string) => {
    const n = Number(String(s).replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : 0;
};

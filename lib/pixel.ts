declare global {
    interface Window {
        fbq?: (...args: unknown[]) => void;
    }
}

export const fbq = (...args: unknown[]): void => {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
        window.fbq(...args);
    }
};

export const trackPageView = (): void => fbq('track', 'PageView');

export const trackViewContent = (value: number, currency = 'MXN'): void =>
    fbq('track', 'ViewContent', { value, currency });

export const trackLead = (value: number, currency = 'MXN'): void =>
    fbq('track', 'Lead', { value, currency });

export const trackContact = (value: number, currency = 'MXN'): void =>
    fbq('track', 'Contact', { value, currency });

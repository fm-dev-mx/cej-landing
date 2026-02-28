export type SchedulingField = "name" | "phone" | "address" | "date";

export type SchedulingValues = {
    name: string;
    phone: string;
    address: string;
    date: string;
};

export function validateName(value: string): string | null {
    return value.trim().length >= 3 ? null : "Ingresa un nombre válido (mínimo 3 caracteres).";
}

export function validatePhone(value: string): string | null {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 10 ? null : "Ingresa un teléfono válido de 10 dígitos.";
}

export function validateAddress(value: string): string | null {
    return value.trim().length >= 5 ? null : "Ingresa una dirección más completa.";
}

export function validateDate(value: string): string | null {
    return value.trim() ? null : "Selecciona una fecha de entrega.";
}

export function getSchedulingErrors(values: SchedulingValues): Record<SchedulingField, string | null> {
    return {
        name: validateName(values.name),
        phone: validatePhone(values.phone),
        address: validateAddress(values.address),
        date: validateDate(values.date),
    };
}

export function isSchedulingFormValid(values: SchedulingValues): boolean {
    const errors = getSchedulingErrors(values);
    return !errors.name && !errors.phone && !errors.address && !errors.date;
}

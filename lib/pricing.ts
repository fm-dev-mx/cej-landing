export type Strength = '150' | '200' | '250' | '300' | '350';
export type ConcreteType = 'convencional' | 'bombeado' | 'fibra';
export type Zone = 'urbana' | 'periferia';

type PriceTable = {
    base: Record<Strength, number>;      // $/m3
    extra: Record<ConcreteType, number>; // $/m3
    freight: Record<Zone, number>;       // tarifa fija
};

export const MXN = 'MXN';

// TODO: ajustar con CEJ
export const PRICE_TABLE: PriceTable = {
    base: { '150': 2050, '200': 2150, '250': 2250, '300': 2400, '350': 2600 },
    extra: { convencional: 0, bombeado: 180, fibra: 350 },
    freight: { urbana: 650, periferia: 950 },
};

export function calcQuote(
    m3: number,
    strength: Strength,
    type: ConcreteType,
    zone: Zone,
) {
    const base = m3 * PRICE_TABLE.base[strength];
    const extras = m3 * PRICE_TABLE.extra[type];
    const freight = PRICE_TABLE.freight[zone];
    const subtotal = base + extras + freight;
    const vat = subtotal * 0.16;
    const total = subtotal + vat;

    return { base, extras, freight, vat, total, subtotal };
}

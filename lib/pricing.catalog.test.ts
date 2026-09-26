import { describe, expect, it, vi } from 'vitest';
import { CONCRETE_OPTIONS, FIBER_PRICE_PER_M3, VAT_RATE, isConcreteOptionAvailable } from '@/config/business';
import type { ConcreteOption, ConcreteType } from '@/components/Calculator/types';
import { calcQuote } from './pricing';

// Independent reference transcribed from the price sheets supplied on 2026-09-25.
// Amounts are MXN per billed m³ and include 8% VAT. Do not derive these from PRICE_TABLE.
// Direct sheet: codex-clipboard-b361029a-d023-4f0a-a1c5-094c81bebc3d.png
// Pumped sheet: codex-clipboard-18ede7f4-fd37-4cba-a0c5-369d77efc08c.png
const direct: [ConcreteOption, number, number, number][] = [
    // Product, 2 m³, 2.5 m³, 3+ m³
    ['100', 2884, 2659, 2534],
    ['150', 3089, 2864, 2639],
    ['200', 3380, 3155, 2930],
    ['210', 3613, 3388, 3163],
    ['250', 3717, 3492, 3267],
    ['300', 3823, 3598, 3373],
    ['150 3/8', 3659, 3459, 3259],
    ['200 3/8', 3877, 3677, 3477],
    ['250 3/8', 3994, 3794, 3594],
];

const pumped: [ConcreteOption, number, number, number][] = [
    // Product, 3–3.5 m³, 4–4.5 m³, 5+ m³
    ['150', 3411, 3261, 3111],
    ['200', 3653, 3503, 3353],
    ['210', 3844, 3654, 3452],
    ['250', 3885, 3735, 3585],
    ['300', 4045, 3895, 3745],
];

type PriceCase = {
    product: ConcreteOption;
    service: ConcreteType;
    requested: number;
    billed: number;
    grossRate: number;
};

const priceCases: PriceCase[] = [
    ...direct.flatMap(([product, atTwo, atTwoAndHalf, atThree]) => [
        { product, service: 'direct' as const, requested: 2, billed: 2, grossRate: atTwo },
        { product, service: 'direct' as const, requested: 2.5, billed: 2.5, grossRate: atTwoAndHalf },
        { product, service: 'direct' as const, requested: 3, billed: 3, grossRate: atThree },
    ]),
    ...pumped.flatMap(([product, atThree, atFour, atFive]) => [
        { product, service: 'pumped' as const, requested: 3, billed: 3, grossRate: atThree },
        { product, service: 'pumped' as const, requested: 3.5, billed: 3.5, grossRate: atThree },
        { product, service: 'pumped' as const, requested: 4, billed: 4, grossRate: atFour },
        { product, service: 'pumped' as const, requested: 4.5, billed: 4.5, grossRate: atFour },
        { product, service: 'pumped' as const, requested: 5, billed: 5, grossRate: atFive },
    ]),
    ...(['mortero 90', 'MR 42.5'] as const).flatMap((product) =>
        [0.5, 1, 1.1, 5].map((requested) => ({
            product,
            service: 'direct' as const,
            requested,
            billed: requested === 0.5 ? 1 : requested === 1.1 ? 1.5 : requested,
            grossRate: product === 'mortero 90' ? 4454 : 3397,
        })),
    ),
];

// Independently assert inclusive VAT, billed-volume surcharges and cent reconciliation.
function expectListedQuote({ product, service, requested, billed, grossRate }: PriceCase, hasFiber: boolean) {
    const quote = calcQuote(requested, product, service, undefined, { hasFiber });
    const grossCents = Math.round(billed * (grossRate + (hasFiber ? 130 : 0)) * 100);
    const netCents = Math.round(grossCents * 100 / 108);
    const fiberNetCents = hasFiber ? Math.round(billed * 13000 * 100 / 108) : 0;

    expect(isConcreteOptionAvailable(product, service)).toBe(true);
    expect(quote.volume.billedM3).toBe(billed);
    expect(quote.hasFiber).toBe(hasFiber);
    expect(quote.total).toBe(grossCents / 100);
    expect(quote.subtotal).toBe(netCents / 100);
    expect(quote.vat).toBe((grossCents - netCents) / 100);
    expect(quote.unitPricePerM3).toBe(Math.round(grossRate * 10000 / 108) / 100);
    expect(quote.fiberSubtotal).toBe(fiberNetCents / 100);
    const concreteCents = Math.round((quote.subtotal - quote.fiberSubtotal) * 100);
    expect(concreteCents + Math.round(quote.fiberSubtotal * 100)).toBe(netCents);
    expect(Math.round(quote.subtotal * 100) + Math.round(quote.vat * 100)).toBe(grossCents);
}

describe('Price sheet contract (VAT included)', () => {
    it('keeps the agreed VAT, fiber rate and product catalog', () => {
        expect(VAT_RATE).toBe(0.08);
        expect(FIBER_PRICE_PER_M3).toBe(130);
        expect(CONCRETE_OPTIONS.map(({ value }) => value).sort()).toEqual([
            '100', '150', '200', '210', '250', '300',
            '150 3/8', '200 3/8', '250 3/8', 'mortero 90', 'MR 42.5',
        ].sort());
    });

    describe.each([false, true])('fiber selected: %s', (hasFiber) => {
        it.each(priceCases)('$service / $product / $requested m³ uses gross rate $grossRate', (reference) => {
            expectListedQuote(reference, hasFiber);
        });
    });

    const transitions: PriceCase[] = [
        { product: '200', service: 'direct', requested: 0.1, billed: 2, grossRate: 3380 },
        { product: '200', service: 'direct', requested: 2.001, billed: 2.5, grossRate: 3155 },
        { product: '200', service: 'direct', requested: 2.501, billed: 3, grossRate: 2930 },
        { product: '200', service: 'direct', requested: 3.001, billed: 3.5, grossRate: 2930 },
        { product: '250 3/8', service: 'direct', requested: 10, billed: 10, grossRate: 3594 },
        { product: '200', service: 'pumped', requested: 2.5, billed: 3, grossRate: 3653 },
        { product: '200', service: 'pumped', requested: 3.001, billed: 3.5, grossRate: 3653 },
        { product: '200', service: 'pumped', requested: 3.501, billed: 4, grossRate: 3503 },
        { product: '200', service: 'pumped', requested: 4.501, billed: 5, grossRate: 3353 },
        { product: '210', service: 'pumped', requested: 10, billed: 10, grossRate: 3452 },
    ];

    it.each(transitions)('bills $requested m³ as $billed m³ for $service / $product, including fiber', (reference) => {
        expectListedQuote(reference, true);
    });

    it.each<ConcreteOption>(['100', '150 3/8', '200 3/8', '250 3/8', 'mortero 90', 'MR 42.5'])(
        'does not quote pumped %s, with or without fiber', (product) => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            try {
                expect(isConcreteOptionAvailable(product, 'pumped')).toBe(false);
                for (const hasFiber of [false, true]) {
                    const quote = calcQuote(3, product, 'pumped', undefined, { hasFiber });
                    expect(quote.total).toBe(0);
                    expect(quote.fiberSubtotal).toBe(0);
                    expect(quote.hasFiber).toBe(false);
                }
            } finally {
                warn.mockRestore();
            }
        },
    );
});

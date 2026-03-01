import type { InternalPaymentDirection, InternalPaymentStatus } from '@/types/internal/order';

export const PAYMENT_EPSILON_MXN = 1.0;

export interface PaymentLedgerLike {
    amount: number;
    direction: InternalPaymentDirection;
    paid_at?: string | null;
}

export interface PaymentSummaryResult {
    paidAmount: number;
    balanceAmount: number;
    paymentStatus: InternalPaymentStatus;
    lastPaidAt: string | null;
}

function round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function summarizePayments(
    totalWithVat: number,
    payments: PaymentLedgerLike[],
    epsilon: number = PAYMENT_EPSILON_MXN
): PaymentSummaryResult {
    const paidAmountRaw = payments.reduce((acc, payment) => {
        if (payment.direction === 'out') return acc - payment.amount;
        return acc + payment.amount;
    }, 0);

    const paidAmount = round2(paidAmountRaw);
    const balanceAmount = Math.max(round2(totalWithVat - paidAmount), 0);

    let paymentStatus: InternalPaymentStatus = 'pending';
    if (paidAmount <= 0) {
        paymentStatus = 'pending';
    } else if (paidAmount + epsilon >= totalWithVat) {
        paymentStatus = 'paid';
    } else {
        paymentStatus = 'partial';
    }

    const lastPaidAt = payments
        .map((payment) => payment.paid_at ?? null)
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? null;

    return {
        paidAmount,
        balanceAmount,
        paymentStatus,
        lastPaidAt,
    };
}

import { describe, expect, it } from 'vitest';
import { summarizePayments } from './orderPayments';

describe('summarizePayments', () => {
    it('marks pending when no payments were registered', () => {
        const summary = summarizePayments(1000, []);

        expect(summary.paidAmount).toBe(0);
        expect(summary.balanceAmount).toBe(1000);
        expect(summary.paymentStatus).toBe('pending');
        expect(summary.lastPaidAt).toBeNull();
    });

    it('marks partial when paid amount is below total and outside epsilon', () => {
        const summary = summarizePayments(1000, [
            { direction: 'in', amount: 300, paid_at: '2026-02-15T10:00:00.000Z' }
        ]);

        expect(summary.paidAmount).toBe(300);
        expect(summary.balanceAmount).toBe(700);
        expect(summary.paymentStatus).toBe('partial');
        expect(summary.lastPaidAt).toBe('2026-02-15T10:00:00.000Z');
    });

    it('marks paid when amount is within epsilon from total', () => {
        const summary = summarizePayments(1000, [
            { direction: 'in', amount: 999.25, paid_at: '2026-02-15T10:00:00.000Z' }
        ]);

        expect(summary.paymentStatus).toBe('paid');
        expect(summary.balanceAmount).toBeCloseTo(0.75, 2);
    });

    it('handles out direction as reversal/adjustment', () => {
        const summary = summarizePayments(1000, [
            { direction: 'in', amount: 1000, paid_at: '2026-02-15T10:00:00.000Z' },
            { direction: 'out', amount: 150, paid_at: '2026-02-16T10:00:00.000Z' }
        ]);

        expect(summary.paidAmount).toBe(850);
        expect(summary.balanceAmount).toBe(150);
        expect(summary.paymentStatus).toBe('partial');
        expect(summary.lastPaidAt).toBe('2026-02-16T10:00:00.000Z');
    });
});

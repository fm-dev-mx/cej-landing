import type { PricingRules } from '@/lib/schemas/pricing';
import type { ConcreteType, QuoteLineItem } from '../quote';
import type { Json } from './json';

export type ServiceType = ConcreteType;

export type QuoteSnapshot = {
    folio: string;
    customer?: {
        name: string;
        phone: string;
        email?: string;
        visitorId?: string;
    };
    items: Array<{
        id: string;
        label: string;
        volume: number;
        service: ServiceType;
        subtotal: number;
        additives?: string[];
    }>;
    financials: {
        total: number;
        subtotal: number;
        vat: number;
        currency: string;
    };
    breakdownLines?: QuoteLineItem[];
    metadata?: Record<string, unknown>;
};

export interface PaymentsSummaryJson {
    total: number;
    net_paid: number;
    paid_in: number;
    paid_out: number;
    balance: number;
    last_paid_at: string | null;
    recomputed_at: string;
}

export interface PricingSnapshotJson {
    version: number;
    computed_at: string;
    inputs: {
        volume: number;
        concreteType: 'direct' | 'pumped';
        strength: string;
    };
    breakdown: Json;
}

export interface DatabaseRowPriceConfig {
    id: number;
    version: number;
    pricing_rules: PricingRules;
    active: boolean;
    created_at: string;
    updated_at: string;
}

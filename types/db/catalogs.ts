import type { PricingRules } from '@/lib/schemas/pricing';
import type { TimestampFields, BaseRow } from './base';
import type { JsonObject } from './json';

export interface DatabaseRowServiceSlots {
    slot_code: string;
    label: string;
    start_time: string;
    end_time: string;
}

export interface BasePriceConfig extends TimestampFields {
    id: number;
    version: number;
    pricing_rules: PricingRules;
}

export interface DatabaseRowPriceConfig extends BasePriceConfig {
    active: boolean;
}

export interface DatabaseRowProduct extends TimestampFields {
    sku: string;
    legacy_external_id: string | null;
    name: string;
    category: string;
    provider_name: string | null;
    mixer_mode: string | null;
    pump_mode: string | null;
    base_price_mxn: number | null;
    client_price_mxn: number | null;
    utility_mxn: number | null;
    status: 'active' | 'inactive';
    metadata_json: JsonObject;
}

export interface DatabaseRowVendor extends BaseRow {
    name: string;
    tax_id: string | null;
    notes: string | null;
}

export interface DatabaseRowAsset extends BaseRow {
    code: string;
    label: string | null;
    asset_type: 'truck' | 'pump' | 'other';
    active: boolean;
}

export interface DatabaseRowEmployee extends BaseRow {
    full_name: string;
    status: 'active' | 'inactive';
    hired_at: string | null;
    left_at: string | null;
    notes: string | null;
}

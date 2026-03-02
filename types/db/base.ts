export interface TimestampFields {
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface AttributionFields {
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_term: string | null;
    utm_content: string | null;
    fbclid: string | null;
    gclid: string | null;
}

export interface BaseRow extends TimestampFields {
    id: string;
}

export interface BaseOrderEntry extends BaseRow {
    order_id: string;
}

export interface ImportFields {
    import_source: string | null;
    import_batch_id: string | null;
    import_row_hash: string | null;
    legacy_folio_raw: string | null;
}

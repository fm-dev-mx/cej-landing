import type { BaseRow } from './base';
import type { JsonObject } from './json';

export interface DatabaseRowLegacyIngestBatch extends BaseRow {
    source_name: string;
    source_file: string;
    file_sha256: string | null;
    started_at: string;
    completed_at: string | null;
    status: 'running' | 'completed' | 'failed' | 'partial';
    row_count: number;
    error_count: number;
    metadata_json: JsonObject;
    created_by: string | null;
}

export interface DatabaseRowLegacyRowRejection {
    id: string;
    ingest_batch_id: string | null;
    source_name: string;
    row_number: number;
    row_hash: string | null;
    reason_code: string;
    reason_detail: string | null;
    raw_payload_json: JsonObject;
    created_at: string;
}

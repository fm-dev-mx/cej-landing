export type CatalogEntity = 'products' | 'vendors' | 'assets' | 'employees';

export interface CatalogListQuery {
    search?: string;
    status?: string;
    page?: number;
    pageSize?: number;
}

export interface CatalogPagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export interface ProductListItem {
    sku: string;
    name: string;
    category: string;
    provider_name: string | null;
    status: 'active' | 'inactive';
    client_price_mxn: number | null;
    updated_at: string;
}

export interface VendorListItem {
    id: string;
    name: string;
    tax_id: string | null;
    notes: string | null;
    updated_at: string;
}

export interface AssetListItem {
    id: string;
    code: string;
    label: string | null;
    asset_type: 'truck' | 'pump' | 'other';
    active: boolean;
    updated_at: string;
}

export interface EmployeeListItem {
    id: string;
    full_name: string;
    status: 'active' | 'inactive';
    hired_at: string | null;
    left_at: string | null;
    updated_at: string;
}

export interface CatalogListResult<T> extends CatalogPagination {
    success: boolean;
    items: T[];
    error?: string;
}

export interface ProductPayload {
    sku: string;
    name: string;
    category: string;
    provider_name?: string | null;
    mixer_mode?: string | null;
    pump_mode?: string | null;
    base_price_mxn?: number | null;
    client_price_mxn?: number | null;
    utility_mxn?: number | null;
    status?: 'active' | 'inactive';
    legacy_external_id?: string | null;
    metadata_json?: Record<string, unknown>;
}

export interface VendorPayload {
    name: string;
    tax_id?: string | null;
    notes?: string | null;
}

export interface AssetPayload {
    code: string;
    label?: string | null;
    asset_type: 'truck' | 'pump' | 'other';
    active?: boolean;
}

export interface EmployeePayload {
    full_name: string;
    status?: 'active' | 'inactive';
    hired_at?: string | null;
    left_at?: string | null;
    notes?: string | null;
}

export interface CatalogMutationResult {
    success: boolean;
    id?: string;
    error?: string;
}

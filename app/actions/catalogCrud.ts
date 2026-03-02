'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/requirePermission';
import { reportError } from '@/lib/monitoring';
import {
    catalogListQuerySchema,
    productPayloadSchema,
    vendorPayloadSchema,
    assetPayloadSchema,
    employeePayloadSchema,
} from '@/lib/schemas/internal/catalogs';
import type {
    CatalogListQuery,
    CatalogListResult,
    ProductListItem,
    VendorListItem,
    AssetListItem,
    EmployeeListItem,
    CatalogMutationResult,
    ProductPayload,
    VendorPayload,
    AssetPayload,
    EmployeePayload,
} from '@/types/internal/catalogs';
import type { Database } from '@/types/database';
import type { JsonObject } from '@/types/db/json';

const EMPTY_PAGE = { page: 1, pageSize: 20, total: 0, totalPages: 0 };

type ProductRow = Database['public']['Tables']['products']['Row'];
type VendorRow = Database['public']['Tables']['vendors']['Row'];
type AssetRow = Database['public']['Tables']['assets']['Row'];
type EmployeeRow = Database['public']['Tables']['employees']['Row'];

function normalizePage(total: number, pageSize: number): number {
    return total === 0 ? 0 : Math.ceil(total / pageSize);
}

export async function buildListResult<T>(items: T[], total: number, page: number, pageSize: number): Promise<CatalogListResult<T>> {
    return { success: true, items, page, pageSize, total, totalPages: normalizePage(total, pageSize) };
}

function handleListError(error: unknown, action: string, msg: string, page: number, pageSize: number) {
    reportError(error, { action });
    return { success: false as const, items: [], page, pageSize, total: 0, totalPages: 0, error: msg };
}

async function getListContext(query: CatalogListQuery) {
    const parsed = catalogListQuerySchema.safeParse(query);
    if (!parsed.success) return { errorResult: { success: false as const, items: [], ...EMPTY_PAGE, error: 'Parámetros inválidos' } };

    const auth = await requirePermission('orders:view');
    if ('status' in auth) return { errorResult: { success: false as const, items: [], ...EMPTY_PAGE, error: auth.message } };

    const { page, pageSize } = parsed.data;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    return { queryData: parsed.data, from, to, admin: await createAdminClient() };
}

async function fetchCatalogList<T>(
    query: CatalogListQuery,
    table: string,
    selectCols: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    applyFilters: (req: any, qData: any) => any,
    actionName: string,
    errorMsg: string
): Promise<CatalogListResult<T>> {
    const c = await getListContext(query);
    if (c.errorResult) return c.errorResult;

    try {
        let request = c.admin
            .from(table)
            .select(selectCols, { count: 'exact' })
            .is('deleted_at', null)
            .order('updated_at', { ascending: false })
            .range(c.from, c.to);

        request = applyFilters(request, c.queryData);

        const { data, count, error } = await request;
        if (error) throw error;

        return await buildListResult((data || []) as unknown as T[], count ?? (data?.length || 0), c.queryData.page, c.queryData.pageSize);
    } catch (error) {
        return handleListError(error, actionName, errorMsg, c.queryData?.page ?? 1, c.queryData?.pageSize ?? 20);
    }
}

export async function listProducts(query: CatalogListQuery = {}): Promise<CatalogListResult<ProductListItem>> {
    return fetchCatalogList<ProductListItem>(query, 'products', 'sku, name, category, provider_name, status, client_price_mxn, updated_at', (req, q) => {
        let res = req;
        if (q.status === 'active' || q.status === 'inactive') res = res.eq('status', q.status);
        if (q.search) res = res.or(`sku.ilike.%${q.search}%,name.ilike.%${q.search}%,category.ilike.%${q.search}%`);
        return res;
    }, 'listProducts', 'No se pudo listar productos');
}

export async function listVendors(query: CatalogListQuery = {}): Promise<CatalogListResult<VendorListItem>> {
    return fetchCatalogList<VendorListItem>(query, 'vendors', 'id, name, tax_id, notes, updated_at', (req, q) => {
        let res = req;
        if (q.search) res = res.or(`name.ilike.%${q.search}%,tax_id.ilike.%${q.search}%`);
        return res;
    }, 'listVendors', 'No se pudo listar proveedores');
}

export async function listAssets(query: CatalogListQuery = {}): Promise<CatalogListResult<AssetListItem>> {
    return fetchCatalogList<AssetListItem>(query, 'assets', 'id, code, label, asset_type, active, updated_at', (req, q) => {
        let res = req;
        if (q.status === 'active') res = res.eq('active', true);
        if (q.status === 'inactive') res = res.eq('active', false);
        if (q.search) res = res.or(`code.ilike.%${q.search}%,label.ilike.%${q.search}%`);
        return res;
    }, 'listAssets', 'No se pudo listar activos');
}

export async function listEmployees(query: CatalogListQuery = {}): Promise<CatalogListResult<EmployeeListItem>> {
    return fetchCatalogList<EmployeeListItem>(query, 'employees', 'id, full_name, status, hired_at, left_at, updated_at', (req, q) => {
        let res = req;
        if (q.status === 'active' || q.status === 'inactive') res = res.eq('status', q.status);
        if (q.search) res = res.ilike('full_name', `%${q.search}%`);
        return res;
    }, 'listEmployees', 'No se pudo listar empleados');
}

async function buildMutationContext<T>(
    payload: unknown,
    errorMsg: string,
    parseFn: (payload: unknown) => { success: boolean; data?: T }
) {
    const auth = await requirePermission('admin:all');
    if ('status' in auth) return { errorResult: { success: false as const, error: auth.message } };

    const parsed = parseFn(payload);
    if (!parsed.success) return { errorResult: { success: false as const, error: errorMsg } };

    return { parsed: parsed.data as T, admin: await createAdminClient() };
}

async function getMutationContext<T>(
    schema: { safeParse: (data: unknown) => { success: boolean; data?: T } },
    payload: unknown,
    errorMsg: string
) {
    return buildMutationContext<T>(payload, errorMsg, (p) => schema.safeParse(p));
}

async function getUpdateContext<T>(
    schema: { partial: () => { safeParse: (data: unknown) => { success: boolean; data?: T } } },
    payload: unknown,
    errorMsg: string
) {
    return buildMutationContext<T>(payload, errorMsg, (p) => schema.partial().safeParse(p));
}

async function fetchById<T>(table: string, idField: string, idVal: string, errMsg: string) {
    const auth = await requirePermission('orders:view');
    if ('status' in auth) return { success: false, error: auth.message };

    try {
        const admin = await createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await admin.from(table as any).select('*').eq(idField, idVal).is('deleted_at', null).maybeSingle();
        if (error || !data) return { success: false, error: errMsg };
        return { success: true, data: data as T };
    } catch (error) {
        reportError(error, { action: `get${table}ById` });
        return { success: false, error: 'Error al obtener registro' };
    }
}

export const getProductById = async (sku: string) => fetchById<ProductRow>('products', 'sku', sku, 'Producto no encontrado');
export const getVendorById = async (id: string) => fetchById<VendorRow>('vendors', 'id', id, 'Proveedor no encontrado');
export const getAssetById = async (id: string) => fetchById<AssetRow>('assets', 'id', id, 'Activo no encontrado');
export const getEmployeeById = async (id: string) => fetchById<EmployeeRow>('employees', 'id', id, 'Empleado no encontrado');

export async function createProduct(payload: ProductPayload): Promise<CatalogMutationResult> {
    const ctx = await getMutationContext(productPayloadSchema, payload, 'Datos inválidos de producto');
    if (ctx.errorResult) return ctx.errorResult;

    try {
        const { admin, parsed: input } = ctx;
        const insertData: Database['public']['Tables']['products']['Insert'] = {
            ...input,
            metadata_json: (input.metadata_json || {}) as JsonObject,
            provider_name: input.provider_name ?? null,
            mixer_mode: input.mixer_mode ?? null,
            pump_mode: input.pump_mode ?? null,
            base_price_mxn: input.base_price_mxn ?? null,
            client_price_mxn: input.client_price_mxn ?? null,
            utility_mxn: input.utility_mxn ?? null,
            legacy_external_id: input.legacy_external_id ?? null,
        };
        const { data, error } = await admin.from('products').insert(insertData).select('sku').single();
        if (error || !data) return { success: false, error: error?.message || 'No se pudo crear producto' };
        return { success: true, id: data.sku };
    } catch (error) {
        reportError(error, { action: 'createProduct' });
        return { success: false, error: 'Error inesperado al crear producto' };
    }
}

export async function updateProduct(sku: string, payload: Partial<ProductPayload>): Promise<CatalogMutationResult> {
    const ctx = await getUpdateContext(productPayloadSchema, payload, 'Datos inválidos de producto');
    if (ctx.errorResult) return ctx.errorResult;

    try {
        const { admin, parsed: patch } = ctx;
        const updateData: Database['public']['Tables']['products']['Update'] = {
            ...patch,
            provider_name: patch.provider_name ?? undefined,
            mixer_mode: patch.mixer_mode ?? undefined,
            pump_mode: patch.pump_mode ?? undefined,
            metadata_json: patch.metadata_json as JsonObject | undefined,
        };
        const { error } = await admin.from('products').update(updateData).eq('sku', sku);
        if (error) return { success: false, error: error.message || 'No se pudo actualizar producto' };
        return { success: true, id: sku };
    } catch (error) {
        reportError(error, { action: 'updateProduct' });
        return { success: false, error: 'Error inesperado al actualizar producto' };
    }
}

export async function createVendor(payload: VendorPayload): Promise<CatalogMutationResult> {
    const ctx = await getMutationContext(vendorPayloadSchema, payload, 'Datos inválidos de proveedor');
    if (ctx.errorResult) return ctx.errorResult;

    try {
        const { admin, parsed } = ctx;
        const { data, error } = await admin.from('vendors').insert(parsed).select('id').single();
        if (error || !data) return { success: false, error: error?.message || 'No se pudo crear proveedor' };
        return { success: true, id: data.id };
    } catch (error) {
        reportError(error, { action: 'createVendor' });
        return { success: false, error: 'Error inesperado al crear proveedor' };
    }
}

export async function updateVendor(id: string, payload: Partial<VendorPayload>): Promise<CatalogMutationResult> {
    const ctx = await getUpdateContext(vendorPayloadSchema, payload, 'Datos inválidos de proveedor');
    if (ctx.errorResult) return ctx.errorResult;

    try {
        const { admin, parsed } = ctx;
        const { error } = await admin.from('vendors').update(parsed).eq('id', id);
        if (error) return { success: false, error: error.message || 'No se pudo actualizar proveedor' };
        return { success: true, id };
    } catch (error) {
        reportError(error, { action: 'updateVendor' });
        return { success: false, error: 'Error inesperado al actualizar proveedor' };
    }
}

export async function createAsset(payload: AssetPayload): Promise<CatalogMutationResult> {
    const ctx = await getMutationContext(assetPayloadSchema, payload, 'Datos inválidos de activo');
    if (ctx.errorResult) return ctx.errorResult;

    try {
        const { admin, parsed } = ctx;
        const { data, error } = await admin.from('assets').insert(parsed).select('id').single();
        if (error || !data) return { success: false, error: error?.message || 'No se pudo crear activo' };
        return { success: true, id: data.id };
    } catch (error) {
        reportError(error, { action: 'createAsset' });
        return { success: false, error: 'Error inesperado al crear activo' };
    }
}

export async function updateAsset(id: string, payload: Partial<AssetPayload>): Promise<CatalogMutationResult> {
    const ctx = await getUpdateContext(assetPayloadSchema, payload, 'Datos inválidos de activo');
    if (ctx.errorResult) return ctx.errorResult;

    try {
        const { admin, parsed } = ctx;
        const { error } = await admin.from('assets').update(parsed).eq('id', id);
        if (error) return { success: false, error: error.message || 'No se pudo actualizar activo' };
        return { success: true, id };
    } catch (error) {
        reportError(error, { action: 'updateAsset' });
        return { success: false, error: 'Error inesperado al actualizar activo' };
    }
}

export async function createEmployee(payload: EmployeePayload): Promise<CatalogMutationResult> {
    const ctx = await getMutationContext(employeePayloadSchema, payload, 'Datos inválidos de empleado');
    if (ctx.errorResult) return ctx.errorResult;

    try {
        const { admin, parsed } = ctx;
        const { data, error } = await admin.from('employees').insert(parsed).select('id').single();
        if (error || !data) return { success: false, error: error?.message || 'No se pudo crear empleado' };
        return { success: true, id: data.id };
    } catch (error) {
        reportError(error, { action: 'createEmployee' });
        return { success: false, error: 'Error inesperado al crear empleado' };
    }
}

export async function updateEmployee(id: string, payload: Partial<EmployeePayload>): Promise<CatalogMutationResult> {
    const ctx = await getUpdateContext(employeePayloadSchema, payload, 'Datos inválidos de empleado');
    if (ctx.errorResult) return ctx.errorResult;

    try {
        const { admin, parsed } = ctx;
        const { error } = await admin.from('employees').update(parsed).eq('id', id);
        if (error) return { success: false, error: error.message || 'No se pudo actualizar empleado' };
        return { success: true, id };
    } catch (error) {
        reportError(error, { action: 'updateEmployee' });
        return { success: false, error: 'Error inesperado al actualizar empleado' };
    }
}

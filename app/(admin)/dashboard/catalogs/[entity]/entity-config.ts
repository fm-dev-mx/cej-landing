import type { CatalogEntity } from '@/types/internal/catalogs';

export const CATALOG_ENTITY_LABELS: Record<CatalogEntity, { title: string; singular: string }> = {
    products: { title: 'Productos', singular: 'producto' },
    vendors: { title: 'Proveedores', singular: 'proveedor' },
    assets: { title: 'Activos', singular: 'activo' },
    employees: { title: 'Empleados', singular: 'empleado' },
};

export function isCatalogEntity(value: string): value is CatalogEntity {
    return value === 'products' || value === 'vendors' || value === 'assets' || value === 'employees';
}

'use server';

import { listOrders } from './listOrders';
import { listExpenses, listPayrollEntries } from './listFinancials';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import { createClient } from '@/lib/supabase/server';

export interface ExportReportResult {
    success: boolean;
    csv?: string;
    error?: string;
}

/**
 * exportReport
 * Generates a basic CSV report with sales, expenses, and payroll data.
 * - Uses the canonical schema fields (total_with_vat, order_status).
 */
export async function exportReport(startDate: string, endDate: string): Promise<ExportReportResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return { success: false, error: 'No autenticado' };
        if (!hasPermission(getUserRole(user.user_metadata), 'financials:view') && !hasPermission(getUserRole(user.user_metadata), 'admin:all')) {
            return { success: false, error: 'Sin permisos' };
        }

        const [ordersRes, expRes, payRes] = await Promise.all([
            listOrders({ startDate, endDate }),
            listExpenses(startDate, endDate),
            listPayrollEntries(startDate, endDate)
        ]);

        if (!ordersRes.success || !expRes.success || !payRes.success) {
            return { success: false, error: 'Fallo al recolectar datos' };
        }

        const orders = ordersRes.orders || [];
        const expenses = expRes.data || [];
        const payroll = payRes.data || [];

        let csv = 'Tipo,Fecha,Referencia,Monto,Categoria\n';

        let totalVenta = 0;
        let totalGasto = 0;
        let totalNomina = 0;

        orders.forEach(o => {
            if (o.order_status !== 'cancelled') {
                totalVenta += Number(o.total_with_vat);
                csv += `Venta,${o.ordered_at},${o.folio},${o.total_with_vat},Ingreso\n`;
            }
        });

        expenses.forEach(e => {
            totalGasto += Number(e.amount);
            csv += `Gasto,${e.expenseDate},${e.reference || ''},${e.amount},${e.category}\n`;
        });

        payroll.forEach(p => {
            totalNomina += Number(p.amount);
            csv += `Nomina,${p.periodStart},${p.employee},${p.amount},Salario\n`;
        });

        const balance = totalVenta - (totalGasto + totalNomina);

        csv += '\nRESUMEN,,,\n';
        csv += `Total Ingresos,,,${totalVenta}\n`;
        csv += `Total Gastos,,,${totalGasto}\n`;
        csv += `Total Nomina,,,${totalNomina}\n`;
        csv += `BALANCE NETO,,,${balance}\n`;

        return { success: true, csv };
    } catch {
        return { success: false, error: 'Error inesperado exportando reporte' };
    }
}

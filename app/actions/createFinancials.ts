'use server';

import { createClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import { expensePayloadSchema, payrollPayloadSchema } from '@/lib/schemas/internal/financials';
import type { ExpensePayload, PayrollPayload } from '@/lib/schemas/internal/financials';

import { type SupabaseClient } from '@supabase/supabase-js';

async function _requireUserWrite(supabase: SupabaseClient) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');
    if (!hasPermission(getUserRole(user.user_metadata), 'financials:write')) throw new Error('Sin permisos');
    return user;
}

export async function createExpense(payload: ExpensePayload) {
    try {
        const supabase = await createClient();
        const expenseUser = await _requireUserWrite(supabase);

        const parsed = expensePayloadSchema.safeParse(payload);
        if (!parsed.success) return { success: false, error: 'Datos de gasto inválidos' };

        const data = parsed.data;
        const { error: expenseError } = await supabase.from('expenses').insert({
            user_id: expenseUser.id,
            amount: data.amount,
            category: data.category,
            expense_date: new Date(data.expenseDate).toISOString(),
            vendor_id: data.vendorId,
            asset_id: data.assetId,
            payment_method_code: data.paymentMethodCode,
            is_reconciled: data.isReconciled ?? false,
            reference: data.reference,
            notes: data.notes
        });

        if (expenseError) throw expenseError;
        return { success: true };
    } catch (err) {
        reportError(err, { action: 'createExpense' });
        return { success: false, error: err instanceof Error && ['No autenticado', 'Sin permisos'].includes(err.message) ? err.message : 'Fallo al guardar gasto' };
    }
}

export async function createPayrollEntry(payload: PayrollPayload) {
    try {
        const supabase = await createClient();
        const payrollUser = await _requireUserWrite(supabase);

        const parsed = payrollPayloadSchema.safeParse(payload);
        if (!parsed.success) return { success: false, error: 'Datos de nómina inválidos' };

        const data = parsed.data;
        const { error: payrollError } = await supabase.from('payroll').insert({
            user_id: payrollUser.id,
            employee: data.employee,
            amount: data.amount,
            period_start: new Date(data.periodStart).toISOString(),
            period_end: new Date(data.periodEnd).toISOString(),
            employee_id: data.employeeId,
            base_salary: data.baseSalary,
            commission_amount: data.commissionAmount,
            loan_discount: data.loanDiscount,
            overtime_amount: data.overtimeAmount,
            trip_amount: data.tripAmount,
            volume_m3: data.volumeM3,
            days_worked: data.daysWorked,
            notes: data.notes
        });

        if (payrollError) throw payrollError;
        return { success: true };
    } catch (err) {
        reportError(err, { action: 'createPayrollEntry' });
        return { success: false, error: 'Fallo al guardar nómina' };
    }
}

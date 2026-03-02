'use server';

import { createClient } from '@/lib/supabase/server';
import { reportError } from '@/lib/monitoring';
import { getUserRole, hasPermission } from '@/lib/auth/rbac';
import type { InternalExpense, InternalPayroll } from '@/types/internal/financials';

import { type SupabaseClient } from '@supabase/supabase-js';

async function _requireUserRead(supabase: SupabaseClient) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !hasPermission(getUserRole(user.user_metadata), 'financials:view')) return null;
    return user;
}

export async function listExpenses(startDate?: string, endDate?: string) {
    try {
        const supabase = await createClient();
        const expenseUser = await _requireUserRead(supabase);
        if (!expenseUser) return { success: false, data: [] };

        let query = supabase.from('expenses').select('*').order('expense_date', { ascending: false });
        if (startDate) query = query.gte('expense_date', startDate);
        if (endDate) query = query.lte('expense_date', endDate);

        const { data: expensesData, error: expensesError } = await query;
        if (expensesError) throw expensesError;

        return {
            success: true, data: (expensesData || []).map(d => ({
                id: d.id, amount: d.amount, currency: d.currency, category: d.category,
                expenseDate: d.expense_date, reference: d.reference, notes: d.notes,
                vendorId: d.vendor_id ?? undefined,
                assetId: d.asset_id ?? undefined,
                paymentMethodCode: d.payment_method_code ?? undefined,
                isReconciled: d.is_reconciled ?? false,
                recordOrigin: d.record_origin ?? 'system_captured',
                sourceBatchId: d.source_batch_id ?? undefined,
                isIncomplete: !d.vendor_id || !d.payment_method_code
            })) as InternalExpense[]
        };
    } catch (error) {
        reportError(error, { action: 'listExpenses' });
        return { success: false, data: [] };
    }
}

export async function listPayrollEntries(startDate?: string, endDate?: string) {
    try {
        const supabase = await createClient();
        const payrollUser = await _requireUserRead(supabase);
        if (!payrollUser) return { success: false, data: [] };

        let query = supabase.from('payroll').select('*').order('period_start', { ascending: false });
        if (startDate) query = query.gte('period_start', startDate);
        if (endDate) query = query.lte('period_end', endDate);

        const { data: payrollData, error: payrollError } = await query;
        if (payrollError) throw payrollError;

        return {
            success: true, data: (payrollData || []).map(d => ({
                id: d.id, employee: d.employee, amount: d.amount, currency: d.currency,
                periodStart: d.period_start, periodEnd: d.period_end, notes: d.notes,
                employeeId: d.employee_id ?? undefined,
                baseSalary: d.base_salary ?? undefined,
                commissionAmount: d.commission_amount ?? undefined,
                loanDiscount: d.loan_discount ?? undefined,
                overtimeAmount: d.overtime_amount ?? undefined,
                tripAmount: d.trip_amount ?? undefined,
                volumeM3: d.volume_m3 ?? undefined,
                daysWorked: d.days_worked ?? undefined,
                recordOrigin: d.record_origin ?? 'system_captured',
                sourceBatchId: d.source_batch_id ?? undefined,
                isIncomplete: !d.employee_id
            })) as InternalPayroll[]
        };
    } catch (error) {
        reportError(error, { action: 'listPayroll' });
        return { success: false, data: [] };
    }
}

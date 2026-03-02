export interface InternalExpense {
    id: string;
    amount: number;
    currency: string;
    category: string;
    expenseDate: string;
    vendorId?: string;
    assetId?: string;
    paymentMethodCode?: string;
    isReconciled?: boolean;
    recordOrigin?: 'legacy_import' | 'system_captured';
    sourceBatchId?: string;
    isIncomplete?: boolean;
    reference?: string;
    notes?: string;
}

export interface InternalPayroll {
    id: string;
    employee: string;
    periodStart: string;
    periodEnd: string;
    amount: number;
    currency: string;
    employeeId?: string;
    baseSalary?: number;
    commissionAmount?: number;
    loanDiscount?: number;
    overtimeAmount?: number;
    tripAmount?: number;
    volumeM3?: number;
    daysWorked?: number;
    recordOrigin?: 'legacy_import' | 'system_captured';
    sourceBatchId?: string;
    isIncomplete?: boolean;
    notes?: string;
}

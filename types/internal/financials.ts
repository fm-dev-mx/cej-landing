export interface InternalExpense {
    id: string;
    amount: number;
    currency: string;
    category: string;
    expenseDate: string;
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
    notes?: string;
}

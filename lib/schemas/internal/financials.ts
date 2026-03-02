import { z } from 'zod';

export const expensePayloadSchema = z.object({
    amount: z.number().positive('El monto debe ser positivo'),
    category: z.string().trim().min(2, 'Categoría requerida'),
    expenseDate: z.string().trim().min(5, 'Fecha requerida'),
    vendorId: z.string().uuid().optional(),
    assetId: z.string().uuid().optional(),
    paymentMethodCode: z.string().trim().min(2).optional(),
    isReconciled: z.boolean().optional(),
    reference: z.string().trim().optional(),
    notes: z.string().trim().optional(),
});

export type ExpensePayload = z.infer<typeof expensePayloadSchema>;

export const payrollPayloadSchema = z.object({
    employee: z.string().trim().min(2, 'Empleado requerido'),
    periodStart: z.string().trim().min(5, 'Inicio requerido'),
    periodEnd: z.string().trim().min(5, 'Fin requerido'),
    amount: z.number().positive('Monto positivo requerido'),
    employeeId: z.string().uuid().optional(),
    baseSalary: z.number().nonnegative().optional(),
    commissionAmount: z.number().optional(),
    loanDiscount: z.number().optional(),
    overtimeAmount: z.number().optional(),
    tripAmount: z.number().optional(),
    volumeM3: z.number().nonnegative().optional(),
    daysWorked: z.number().nonnegative().optional(),
    notes: z.string().trim().optional(),
});

export type PayrollPayload = z.infer<typeof payrollPayloadSchema>;

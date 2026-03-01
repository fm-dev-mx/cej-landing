import { z } from 'zod';

export const expensePayloadSchema = z.object({
    amount: z.number().positive('El monto debe ser positivo'),
    category: z.string().trim().min(2, 'Categoría requerida'),
    expenseDate: z.string().trim().min(5, 'Fecha requerida'),
    reference: z.string().trim().optional(),
    notes: z.string().trim().optional(),
});

export type ExpensePayload = z.infer<typeof expensePayloadSchema>;

export const payrollPayloadSchema = z.object({
    employee: z.string().trim().min(2, 'Empleado requerido'),
    periodStart: z.string().trim().min(5, 'Inicio requerido'),
    periodEnd: z.string().trim().min(5, 'Fin requerido'),
    amount: z.number().positive('Monto positivo requerido'),
    notes: z.string().trim().optional(),
});

export type PayrollPayload = z.infer<typeof payrollPayloadSchema>;

export type DbOrderStatus = 'draft' | 'confirmed' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type DbPaymentStatus = 'pending' | 'partial' | 'paid' | 'overpaid';
export type DbFiscalStatus = 'not_requested' | 'requested' | 'issued' | 'cancelled';
export type DbPaymentDirection = 'in' | 'out';
export type DbPaymentKind = 'anticipo' | 'abono' | 'liquidacion' | 'ajuste' | 'refund' | 'chargeback';
export type DbPaymentMethod = 'efectivo' | 'transferencia' | 'credito' | 'deposito' | 'otro';
export type DbLeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'archived';
export type DbRecordOrigin = 'legacy_import' | 'system_captured';

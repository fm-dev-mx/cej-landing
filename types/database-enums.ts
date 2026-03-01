export type DbOrderStatus = 'draft' | 'pending_payment' | 'scheduled' | 'delivered' | 'cancelled';
export type DbPaymentStatus = 'pending' | 'partial' | 'paid' | 'cancelled';
export type DbFiscalStatus = 'not_requested' | 'requested' | 'issued' | 'cancelled';
export type DbPaymentDirection = 'in' | 'out';
export type DbPaymentKind = 'anticipo' | 'abono' | 'liquidacion' | 'ajuste' | 'refund' | 'chargeback';
export type DbPaymentMethod = 'efectivo' | 'transferencia' | 'credito' | 'deposito' | 'otro';

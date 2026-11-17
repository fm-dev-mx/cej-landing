import type { Database } from "@/types/database";
// Transitions are enforced once by the database command, never by a second client state machine.
export const orderStatusLabels: Record<
  Database["public"]["Enums"]["order_status_enum"],
  string
> = {
  draft: "Borrador",
  confirmed: "Confirmado",
  scheduled: "Programado",
  in_progress: "En entrega",
  completed: "Entregado",
  cancelled: "Cancelado",
};
export const paymentStatusLabels: Record<
  Database["public"]["Enums"]["payment_status_enum"],
  string
> = {
  pending: "Pendiente",
  partial: "Parcial",
  paid: "Liquidado",
  overpaid: "Excedente",
};
export const roleLabels: Record<string, string> = {
  owner: "Propietario",
  admin: "Administrador",
  operator: "Operador",
  viewer: "Consulta",
};

import CommandForm from "@/components/panel/CommandForm";
import { panelSession } from "@/lib/commercial/queries";
import Link from "next/link";
export default async function NewCustomer() {
  await panelSession();
  return (
    <>
      <h1>Alta de cliente</h1>
      <CommandForm
        kind="customer"
        fields={[
          { name: "name", label: "Nombre del cliente", required: true },
          {
            name: "phone",
            label: "Teléfono (opcional)",
            hint: "10 dígitos locales, +52 México o +1 EE. UU.",
          },
        ]}
        label="Guardar cliente"
        destination="/panel/clientes/:id"
      />
      <Link href="/panel/cotizar">Volver al cotizador</Link>
    </>
  );
}

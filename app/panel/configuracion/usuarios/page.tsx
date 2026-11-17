import { requirePermission } from "@/lib/auth/requirePermission";
import { createAdminClient } from "@/lib/supabase/server";
import CommandForm from "@/components/panel/CommandForm";
export default async function Members() {
  const s = await requirePermission("configure");
  const { data, error } = await createAdminClient()
    .from("company_memberships")
    .select("user_id,role,active")
    .eq("company_id", s.company.id)
    .order("user_id");
  if (error) throw new Error("read_failed");
  return (
    <>
      <h1>Membresías de empresa</h1>
      <p>
        Se administran en servidor y RLS. No se usa el rol editable del perfil
        de autenticación. El usuario debe existir previamente; esta pantalla no
        crea cuentas externas.
      </p>
      <ul>
        {data?.map((m) => (
          <li key={m.user_id}>
            {m.user_id} · {m.role} · {m.active ? "activo" : "inactivo"}
          </li>
        ))}
      </ul>
      <CommandForm
        kind="membership"
        fields={[
          { name: "user_id", label: "ID de usuario existente", required: true },
          {
            name: "role",
            label: "Rol en esta empresa",
            type: "select",
            required: true,
            options: [
              { value: "viewer", label: "Consulta" },
              { value: "operator", label: "Operador" },
              { value: "admin", label: "Administrador" },
              { value: "owner", label: "Propietario" },
            ],
          },
          { name: "active", label: "Membresía activa", type: "checkbox" },
          { name: "reason", label: "Motivo del cambio", required: true },
        ]}
        label="Guardar membresía"
      />
    </>
  );
}

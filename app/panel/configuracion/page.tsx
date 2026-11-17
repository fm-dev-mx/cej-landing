import Link from "next/link";
import { requirePermission } from "@/lib/auth/requirePermission";
import {
  BUSINESS_INFO,
  QUOTE_VALIDITY_DAYS,
  PRICE_TABLE,
} from "@/config/business";
import { profileSchema } from "@/lib/commercial/schemas";
import { CATALOG_VERSION } from "@/lib/commercial/quote";
import { loadPendingData } from "@/lib/commercial/queries";
import CommandForm from "@/components/panel/CommandForm";
import PendingData from "@/components/panel/PendingData";
import styles from "../panel.module.scss";
export default async function Settings() {
  const s = await requirePermission("approve");
  const parsed = profileSchema.safeParse(s.company.quote_profile);
  const profile = parsed.success ? parsed.data : null;
  const pending = await loadPendingData(s);
  return (
    <>
      <h1>Configuración</h1>
      <PendingData items={pending} />
      <nav className={styles.nav}>
        <Link href="/panel/configuracion/importaciones">
          Importaciones y conciliación
        </Link>
        <Link href="/panel/configuracion/usuarios">Usuarios y membresías</Link>
      </nav>
      <section className={styles.card}>
        <h2>Catálogo compartido</h2>
        <p>
          Versión {CATALOG_VERSION}. La web y el panel consumen el catálogo de
          main; los cambios de tarifa por oferta requieren autorización de la
          revisión exacta.
        </p>
        <details>
          <summary>Consultar tarifas oficiales del código</summary>
          <pre className={styles.pre}>
            {JSON.stringify(PRICE_TABLE, null, 2)}
          </pre>
        </details>
        <p>
          Los cambios globales de catálogo requieren una versión revisada del
          código. No hay un segundo editor con reglas divergentes.
        </p>
      </section>
      <section className={styles.card}>
        <h2>Datos y condiciones para emisión formal</h2>
        <p>
          Referencia actual de la web: {BUSINESS_INFO.name};{" "}
          {BUSINESS_INFO.address.street}, {BUSINESS_INFO.address.colony},{" "}
          {BUSINESS_INFO.address.postalCode}. Vigencia declarada en código:{" "}
          {QUOTE_VALIDITY_DAYS} días. Develop contiene otro domicilio; revisa el
          dato real antes de autorizar.
        </p>
        {s.role === "owner" ? (
          <CommandForm
            kind="configure"
            fields={[
              {
                name: "profile.name",
                label: "Nombre o razón social validada",
                required: true,
                value: profile?.name ?? BUSINESS_INFO.name,
              },
              {
                name: "profile.tax_id",
                label: "RFC real validado",
                required: true,
                value: profile?.tax_id,
              },
              {
                name: "profile.address",
                label: "Domicilio real validado",
                required: true,
                value: profile?.address,
              },
              {
                name: "profile.contact",
                label: "Contacto comercial validado",
                required: true,
                value: profile?.contact,
              },
              {
                name: "profile.conditions",
                label: "Condiciones comerciales validadas",
                type: "textarea",
                required: true,
                value: profile?.conditions,
              },
              {
                name: "profile.validity_days",
                label: "Vigencia autorizada (días)",
                type: "number",
                min: 1,
                step: "1",
                required: true,
                value: profile?.validity_days,
              },
              {
                name: "freight_tax",
                label: "Tratamiento de IVA de los $1,500 de Samalayuca",
                type: "select",
                value: s.company.freight_tax ?? "",
                options: [
                  { value: "included", label: "IVA incluido en la tarifa" },
                  { value: "additional", label: "IVA adicional a la tarifa" },
                ],
              },
              {
                name: "freight_vat_rate",
                label:
                  "Tasa confirmada de IVA del flete (fracción; vacío si no está confirmada)",
                type: "number",
                min: 0,
                step: "0.01",
                value: s.company.freight_vat_rate ?? "",
              },
              {
                name: "verified",
                label:
                  "Validé los datos, la vigencia y las condiciones comerciales",
                type: "checkbox",
              },
            ]}
            label="Guardar configuración validada"
          />
        ) : (
          <p>Solo un propietario puede validar estos datos.</p>
        )}
      </section>
      <section className={styles.card}>
        <h2>Medición de marketing</h2>
        <p>
          Envíos de producción deshabilitados. Las solicitudes y ventas se
          registran localmente y mantienen una intención pendiente de
          elegibilidad. La API, el destino por empresa y la atribución requieren
          validación independiente.
        </p>
      </section>
    </>
  );
}

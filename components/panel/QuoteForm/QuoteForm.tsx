"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CONCRETE_OPTIONS,
  isConcreteOptionAvailable,
  COFFERED_SPECS,
} from "@/config/business";
import { calcVolumeFromArea } from "@/lib/pricing";
import {
  submitCommand,
  lookupQuoteChoices,
  type ActionResult,
} from "@/app/panel/actions";
import type { QuoteInput } from "@/lib/commercial/schemas";
import type { CofferedSize } from "@/components/Calculator/types";
import CommandForm from "@/components/panel/CommandForm";
import styles from "./QuoteForm.module.scss";
interface Props {
  customers: {
    id: string;
    display_name: string;
    primary_phone_norm: string | null;
  }[];
  projects: {
    id: string;
    customer_id: string;
    name: string;
    address: string;
  }[];
  initial?: QuoteInput;
  quoteId?: string;
  version?: number;
  customerId?: string;
  projectId?: string;
  leadId?: number;
  customerCount?: number;
  projectCount?: number;
}
export default function QuoteForm({
  customers,
  projects,
  initial,
  quoteId,
  version,
  customerId,
  projectId,
  leadId,
  customerCount = customers.length,
  projectCount = projects.length,
}: Props) {
  const [mode, setMode] = useState<"generic" | "formal">(
    initial?.mode ?? (customerId ? "formal" : "generic"),
  );
  const [direct, setDirect] = useState(false);
  const [type, setType] = useState<"direct" | "pumped">(
    initial?.type ?? "direct",
  );
  const [customer, setCustomer] = useState(customerId ?? "");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  const router = useRouter();
  const [addedCustomers, setAddedCustomers] = useState<Props["customers"]>([]);
  const [choices, setChoices] = useState({
    customers,
    projects,
    customerCount,
    projectCount,
  });
  const [customerTerm, setCustomerTerm] = useState("");
  const [projectTerm, setProjectTerm] = useState("");
  const [lookupPending, setLookupPending] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const lookupVersion = useRef(0);
  const [addedProjects, setAddedProjects] = useState<Props["projects"]>([]);
  const [selectedProject, setSelectedProject] = useState(projectId ?? "");
  async function lookup(selectedCustomer = customer) {
    const version = ++lookupVersion.current;
    setLookupPending(true);
    setLookupError("");
    try {
      const result = await lookupQuoteChoices({
        customerTerm,
        projectTerm,
        customerId: selectedCustomer || undefined,
      });
      if (version === lookupVersion.current) setChoices(result);
    } catch {
      if (version === lookupVersion.current)
        setLookupError(
          "No se pudo buscar. Conservamos tu captura; vuelve a intentar.",
        );
    } finally {
      if (version === lookupVersion.current) setLookupPending(false);
    }
  }
  const formRef = useRef<HTMLFormElement>(null);
  const [assisted, setAssisted] = useState("");
  function assist() {
    const f = new FormData(formRef.current!);
    const size = String(f.get("coffered")) as CofferedSize;
    const volume = calcVolumeFromArea({
      areaM2: Number(f.get("area")),
      hasCofferedSlab: true,
      cofferedSize: size,
    });
    const input = formRef.current!.elements.namedItem(
      "volume",
    ) as HTMLInputElement;
    if (volume > 0) {
      input.value = String(volume);
      setAssisted(
        `Volumen geométrico: ${volume.toFixed(3)} m³. ${COFFERED_SPECS[size].label} es dimensión del casetón; no es espesor de concreto ni un producto agregado a la venta.`,
      );
    }
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    setResult(null);
    const f = new FormData(event.currentTarget);
    const text = (key: string) => String(f.get(key) ?? "");
    const input = {
      volume: Number(f.get("volume")),
      strength: text("strength"),
      type,
      hasFiber: f.has("hasFiber"),
      zone: text("zone"),
      capacity: Number(f.get("capacity")),
      trucks: text("trucks") ? Number(f.get("trucks")) : undefined,
      truckReason: text("truckReason"),
      freightRate: Number(f.get("freightRate")),
      discount: Number(f.get("discount")),
      reason: text("reason"),
      mode,
    };
    const identity =
      mode === "formal" || direct
        ? {
            customer_id: customer || undefined,
            project_id: text("project") || undefined,
          }
        : {};
    try {
      const response = await submitCommand(
        direct
          ? { kind: "order", input, ...identity, address: text("address") }
          : {
              kind: "quote",
              input,
              ...identity,
              ...(quoteId ? { id: quoteId, expected_version: version } : {}),
              ...(mode === "formal" && text("lead")
                ? { lead_id: Number(text("lead")) }
                : {}),
            },
      );
      setResult(response);
      if (response.ok) {
        router.push(
          `/panel/${direct ? "pedidos" : "cotizaciones"}/${response.id}`,
        );
        router.refresh();
      }
    } catch {
      setResult({
        ok: false,
        message:
          "No se pudo conectar. Conservamos los datos; revisa antes de reintentar.",
      });
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  const error = (key: string) =>
    result?.fields?.[`input.${key}`] && (
      <small role="alert">{result.fields[`input.${key}`]}</small>
    );
  return (
    <>
      {(mode === "formal" || direct) && (
        <details>
          <summary>Alta breve de cliente sin perder la captura</summary>
          <CommandForm
            kind="customer"
            fields={[
              {
                name: "name",
                label: "Nombre del nuevo cliente",
                required: true,
              },
              { name: "phone", label: "Teléfono del nuevo cliente (opcional)" },
            ]}
            label="Crear y seleccionar cliente"
            onSaved={(r, data) => {
              if (r.id) {
                setAddedCustomers((prev) => [
                  ...prev,
                  {
                    id: r.id!,
                    display_name: String(data.name),
                    primary_phone_norm: String(data.phone) || null,
                  },
                ]);
                setCustomer(r.id);
              }
            }}
          />
        </details>
      )}
      {(mode === "formal" || direct) && customer && (
        <details>
          <summary>Alta breve de obra para el cliente seleccionado</summary>
          <CommandForm
            kind="project"
            payload={{ customer_id: customer }}
            fields={[
              {
                name: "name",
                label: "Nombre de la nueva obra",
                required: true,
              },
              {
                name: "address",
                label: "Dirección de la nueva obra",
                required: true,
              },
            ]}
            label="Crear y seleccionar obra"
            onSaved={(r, data) => {
              if (r.id) {
                setAddedProjects((prev) => [
                  ...prev,
                  {
                    id: r.id!,
                    customer_id: customer,
                    name: String(data.name),
                    address: String(data.address),
                  },
                ]);
                setSelectedProject(r.id);
              }
            }}
          />
        </details>
      )}
      <form ref={formRef} onSubmit={save} className={styles.form}>
        {!quoteId && (
          <label>
            <input
              type="checkbox"
              checked={direct}
              onChange={(e) => setDirect(e.target.checked)}
            />{" "}
            Capturar pedido directo, sin cotización previa
          </label>
        )}
        {!direct && (
          <label>
            Tipo de cotización
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "generic" | "formal")}
            >
              <option value="generic">Genérica · sin datos de cliente</option>
              <option value="formal">Formal · con cliente</option>
            </select>
          </label>
        )}
        {(mode === "formal" || direct) && (
          <fieldset>
            <legend>Cliente y obra</legend>
            {!direct && (
              <label>
                Folio de solicitud real (opcional)
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="lead"
                  defaultValue={leadId}
                />
                <small>
                  Vincula solo una solicitud existente de este cliente. No es
                  obligatorio tener una solicitud previa.
                </small>
              </label>
            )}
            <label>
              Buscar cliente por nombre o teléfono
              <input
                value={customerTerm}
                onChange={(e) => setCustomerTerm(e.target.value)}
              />
            </label>
            <button
              type="button"
              disabled={lookupPending}
              onClick={() => lookup()}
            >
              Buscar clientes y obras
            </button>
            <p>
              Clientes: {choices.customers.length} de {choices.customerCount}.
              Refina la búsqueda si faltan resultados.
            </p>
            {lookupError && <p role="alert">{lookupError}</p>}
            <label>
              Cliente
              <select
                required
                value={customer}
                onChange={(e) => {
                  setCustomer(e.target.value);
                  setSelectedProject("");
                  void lookup(e.target.value);
                }}
              >
                <option value="">Selecciona un cliente</option>
                {[
                  ...choices.customers,
                  ...addedCustomers.filter(
                    (c) =>
                      !choices.customers.some(
                        (existing) => existing.id === c.id,
                      ),
                  ),
                ].map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name} · {c.primary_phone_norm ?? "sin teléfono"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Buscar obra del cliente
              <input
                value={projectTerm}
                onChange={(e) => setProjectTerm(e.target.value)}
              />
            </label>
            <p>
              Obras: {choices.projects.length} de {choices.projectCount}. Usa la
              búsqueda para encontrar otras.
            </p>
            <label>
              Obra
              <select
                key={customer}
                name="project"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="">Sin obra asociada</option>
                {[
                  ...choices.projects,
                  ...addedProjects.filter(
                    (p) =>
                      !choices.projects.some(
                        (existing) => existing.id === p.id,
                      ),
                  ),
                ]
                  .filter((p) => p.customer_id === customer)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </label>
            <p>
              Usa las altas breves de esta pantalla para conservar la captura.
            </p>
            {direct && (
              <label>
                Dirección de entrega
                <input name="address" required minLength={5} />
              </label>
            )}
          </fieldset>
        )}
        <fieldset>
          <legend>Concreto y entrega</legend>
          <label>
            Volumen solicitado (m³)
            <input
              name="volume"
              type="number"
              min="0.001"
              step="any"
              required
              defaultValue={initial?.volume}
            />
            {error("volume")}
          </label>
          <details>
            <summary>Ayuda de volumen con casetón</summary>
            <label>
              Área (m²)
              <input type="number" name="area" min="0" step="any" />
            </label>
            <label>
              Casetón
              <select name="coffered">
                <option value="7">7 cm · factor 0.085 m³/m²</option>
                <option value="10">10 cm · factor 0.108 m³/m²</option>
              </select>
            </label>
            <button type="button" onClick={assist}>
              Usar volumen calculado
            </button>
            <p role="status">{assisted}</p>
          </details>
          <label>
            Entrega
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "direct" | "pumped")}
            >
              <option value="direct">Tiro directo</option>
              <option value="pumped">Bombeado · incluido en tarifa</option>
            </select>
          </label>
          <label>
            Concreto
            <select
              key={type}
              name="strength"
              defaultValue={initial?.strength ?? "200"}
            >
              {CONCRETE_OPTIONS.filter((o) =>
                isConcreteOptionAvailable(o.value, type),
              ).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              name="hasFiber"
              defaultChecked={initial?.hasFiber}
            />{" "}
            Fibra de polipropileno · tarifa de catálogo por m³
          </label>
          <label>
            Zona
            <select name="zone" defaultValue={initial?.zone ?? "local"}>
              <option value="local">
                Local · sin regla adicional de Samalayuca
              </option>
              <option value="samalayuca">Samalayuca</option>
            </select>
          </label>
          <p>
            Para Samalayuca: ceil(volumen / capacidad) + 1 camión si es
            bombeado. El tratamiento de IVA pendiente deja la oferta en
            borrador.
          </p>
          <label>
            Capacidad de referencia (m³)
            <input
              type="number"
              name="capacity"
              min="0.001"
              step="any"
              required
              defaultValue={initial?.capacity ?? 7}
            />
            {error("capacity")}
          </label>
          <label>
            Camiones efectivos (opcional)
            <input
              type="number"
              name="trucks"
              min="1"
              step="1"
              defaultValue={initial?.trucks}
            />
            {error("trucks")}
          </label>
          <label>
            Motivo del ajuste operativo
            <input name="truckReason" defaultValue={initial?.truckReason} />
            {error("truckReason")}
          </label>
        </fieldset>
        <fieldset>
          <legend>Precio y condiciones</legend>
          <p>
            Se calculan en servidor con el catálogo compartido de la web. Los
            cambios económicos requieren autorización de esta revisión.
          </p>
          <label>
            Tarifa de flete Samalayuca por camión (MXN)
            <input
              type="number"
              name="freightRate"
              min="0.01"
              step="0.01"
              required
              defaultValue={initial?.freightRate ?? 1500}
            />
            {error("freightRate")}
          </label>
          <label>
            Descuento en concreto y fibra (MXN)
            <input
              type="number"
              name="discount"
              min="0"
              step="0.01"
              required
              defaultValue={initial?.discount ?? 0}
            />
            {error("discount")}
          </label>
          <label>
            Motivo de excepción económica
            <textarea name="reason" defaultValue={initial?.reason} />
            {error("reason")}
          </label>
        </fieldset>
        <button disabled={pending}>
          {pending
            ? "Guardando…"
            : direct
              ? "Guardar pedido en borrador"
              : quoteId
                ? "Guardar nueva revisión"
                : "Guardar cotización"}
        </button>
        {result && (
          <p role={result.ok ? "status" : "alert"}>{result.message}</p>
        )}
      </form>
    </>
  );
}

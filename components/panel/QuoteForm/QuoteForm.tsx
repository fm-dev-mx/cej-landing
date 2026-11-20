"use client";
import { useEffect, useRef, useState } from "react";
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
  previewQuote,
  type ActionResult,
  type QuotePreviewResult,
} from "@/app/panel/actions";
import { money } from "@/lib/commercial/quote";
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
  const [selectedProject, setSelectedProject] = useState(projectId ?? "");
  const [volume, setVolume] = useState(
    initial?.volume !== undefined ? String(initial.volume) : "",
  );
  const [strength, setStrength] = useState(initial?.strength ?? "200");
  const [hasFiber, setHasFiber] = useState(Boolean(initial?.hasFiber));
  const [zone, setZone] = useState<"local" | "samalayuca">(
    initial?.zone ?? "local",
  );
  const [capacity, setCapacity] = useState(
    initial?.capacity !== undefined ? String(initial.capacity) : "7",
  );
  const [trucks, setTrucks] = useState(
    initial?.trucks !== undefined ? String(initial.trucks) : "",
  );
  const [truckReason, setTruckReason] = useState(initial?.truckReason ?? "");
  const [freightRate, setFreightRate] = useState(
    initial?.freightRate !== undefined ? String(initial.freightRate) : "1500",
  );
  const [discount, setDiscount] = useState(
    initial?.discount !== undefined ? String(initial.discount) : "0",
  );
  const [reason, setReason] = useState(initial?.reason ?? "");
  const [lead, setLead] = useState(leadId !== undefined ? String(leadId) : "");
  const [address, setAddress] = useState("");

  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);
  const locked = useRef(false);
  const router = useRouter();

  const [addedCustomers, setAddedCustomers] = useState<Props["customers"]>([]);
  const [searchChoices, setSearchChoices] = useState<{
    customers: Props["customers"];
    projects: Props["projects"];
    customerCount: number;
    projectCount: number;
  } | null>(null);

  const choices = searchChoices ?? {
    customers,
    projects,
    customerCount,
    projectCount,
  };
  const [customerTerm, setCustomerTerm] = useState("");
  const [projectTerm, setProjectTerm] = useState("");
  const [lookupPending, setLookupPending] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const lookupVersion = useRef(0);
  const customerSelectRef = useRef<HTMLSelectElement>(null);
  const [addedProjects, setAddedProjects] = useState<Props["projects"]>([]);

  // Live total preview
  const [preview, setPreview] = useState<QuotePreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewSeq = useRef(0);

  const volNum = Number(volume);
  const capNum = Number(capacity);
  const previewMissing =
    !volume || isNaN(volNum) || volNum <= 0
      ? "falta indicar el volumen solicitado"
      : zone === "samalayuca" && (!capacity || isNaN(capNum) || capNum <= 0)
        ? "falta indicar la capacidad de transporte"
        : "";

  useEffect(() => {
    if (previewMissing) {
      return;
    }
    const seq = ++previewSeq.current;

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await previewQuote({
          volume: volNum,
          strength,
          type,
          hasFiber,
          zone,
          capacity: zone === "samalayuca" ? Number(capacity) || 7 : 7,
          trucks: zone === "samalayuca" && trucks ? Number(trucks) : undefined,
          truckReason: zone === "samalayuca" ? truckReason : "",
          freightRate:
            zone === "samalayuca" ? Number(freightRate) || 1500 : 1500,
          discount: Number(discount) || 0,
          reason,
          mode,
        });
        if (seq === previewSeq.current) {
          if (res.ok) {
            setPreview(res);
          } else {
            setPreview(null);
          }
        }
      } catch {
        if (seq === previewSeq.current) {
          setPreview(null);
        }
      } finally {
        if (seq === previewSeq.current) {
          setPreviewLoading(false);
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [
    previewMissing,
    volNum,
    strength,
    type,
    hasFiber,
    zone,
    capacity,
    trucks,
    truckReason,
    freightRate,
    discount,
    reason,
    mode,
  ]);

  async function lookup(selectedCustomer = customer, term = customerTerm) {
    const v = ++lookupVersion.current;
    setLookupPending(true);
    setLookupError("");
    try {
      const res = await lookupQuoteChoices({
        customerTerm: term,
        projectTerm,
        customerId: selectedCustomer || undefined,
      });
      if (v === lookupVersion.current) {
        setSearchChoices(res);
        if (selectedCustomer) {
          const custProjects = [
            ...res.projects,
            ...addedProjects.filter((p) => p.customer_id === selectedCustomer),
          ].filter((p) => p.customer_id === selectedCustomer);
          if (custProjects.length > 0 && !selectedProject) {
            setSelectedProject(custProjects[0].id);
          }
        }
      }
      return res;
    } catch {
      if (v === lookupVersion.current)
        setLookupError(
          "No se pudo buscar. Conservamos tu captura; vuelve a intentar.",
        );
    } finally {
      if (v === lookupVersion.current) setLookupPending(false);
    }
  }

  function handleCustomerSelect(
    newCustomerId: string,
    currentChoices = choices,
  ) {
    setCustomer(newCustomerId);
    if (!newCustomerId) {
      setSelectedProject("");
      return;
    }
    const matchingProjects = [
      ...currentChoices.projects,
      ...addedProjects.filter((p) => p.customer_id === newCustomerId),
    ].filter((p) => p.customer_id === newCustomerId);
    if (matchingProjects.length > 0) {
      setSelectedProject(matchingProjects[0].id);
    } else {
      setSelectedProject("");
    }
    void lookup(newCustomerId);
  }

  const formRef = useRef<HTMLFormElement>(null);
  const [assisted, setAssisted] = useState("");

  function assist() {
    const f = new FormData(formRef.current!);
    const size = String(f.get("coffered")) as CofferedSize;
    const calculatedVolume = calcVolumeFromArea({
      areaM2: Number(f.get("area")),
      hasCofferedSlab: true,
      cofferedSize: size,
    });
    if (calculatedVolume > 0) {
      setVolume(String(calculatedVolume));
      setAssisted(
        `Volumen geométrico: ${calculatedVolume.toFixed(3)} m³. ${COFFERED_SPECS[size].label} es dimensión del casetón; no es espesor de concreto ni un producto agregado a la venta.`,
      );
    }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    setResult(null);

    const input = {
      volume: Number(volume),
      strength,
      type,
      hasFiber,
      zone,
      capacity: zone === "samalayuca" ? Number(capacity) || 7 : 7,
      trucks: zone === "samalayuca" && trucks ? Number(trucks) : undefined,
      truckReason: zone === "samalayuca" ? truckReason : "",
      freightRate: zone === "samalayuca" ? Number(freightRate) || 1500 : 1500,
      discount: Number(discount) || 0,
      reason,
      mode,
    };
    const identity =
      mode === "formal" || direct
        ? {
            customer_id: customer || undefined,
            project_id: selectedProject || undefined,
          }
        : {};
    try {
      const response = await submitCommand(
        direct
          ? { kind: "order", input, ...identity, address }
          : {
              kind: "quote",
              input,
              ...identity,
              ...(quoteId ? { id: quoteId, expected_version: version } : {}),
              ...(mode === "formal" && lead ? { lead_id: Number(lead) } : {}),
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
        <div className={styles.altasBreves}>
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
                {
                  name: "phone",
                  label: "Teléfono del nuevo cliente (opcional)",
                },
              ]}
              label="Crear y seleccionar cliente"
              onSaved={(r, data) => {
                if (r.id) {
                  const newCust = {
                    id: r.id!,
                    display_name: String(data.name),
                    primary_phone_norm: String(data.phone) || null,
                  };
                  setAddedCustomers((prev) => [...prev, newCust]);
                  handleCustomerSelect(r.id!, {
                    ...choices,
                    customers: [newCust, ...choices.customers],
                  });
                }
              }}
            />
          </details>
          {customer && (
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
        </div>
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
                  value={lead}
                  onChange={(e) => setLead(e.target.value)}
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
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const res = await lookup(customer, customerTerm);
                    customerSelectRef.current?.focus();
                    if (res?.customers?.length === 1 && !customer) {
                      handleCustomerSelect(res.customers[0].id, res);
                    }
                  } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    customerSelectRef.current?.focus();
                  }
                }}
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
              {choices.customerCount > choices.customers.length &&
                " Refina la búsqueda si faltan resultados."}
            </p>
            {lookupError && <p role="alert">{lookupError}</p>}
            <label>
              Cliente
              <select
                ref={customerSelectRef}
                required
                value={customer}
                onChange={(e) => {
                  handleCustomerSelect(e.target.value);
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void lookup(customer);
                  }
                }}
              />
            </label>
            <p>
              Obras: {choices.projects.length} de {choices.projectCount}.
              {choices.projectCount > choices.projects.length &&
                " Usa la búsqueda para encontrar otras."}
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
                <input
                  name="address"
                  required
                  minLength={5}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
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
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              aria-invalid={Boolean(result?.fields?.["input.volume"])}
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
              value={strength}
              onChange={(e) =>
                setStrength(e.target.value as QuoteInput["strength"])
              }
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
              checked={hasFiber}
              onChange={(e) => setHasFiber(e.target.checked)}
            />{" "}
            Fibra de polipropileno · tarifa de catálogo por m³
          </label>
          <label>
            Zona
            <select
              name="zone"
              value={zone}
              onChange={(e) =>
                setZone(e.target.value as "local" | "samalayuca")
              }
              aria-invalid={Boolean(result?.fields?.["input.zone"])}
            >
              <option value="local">
                Local · sin regla adicional de Samalayuca
              </option>
              <option value="samalayuca">Samalayuca</option>
            </select>
            {error("zone")}
          </label>
          {zone === "samalayuca" && (
            <>
              <p>
                Para Samalayuca: camiones necesarios según volumen y capacidad,
                más uno si el servicio es bombeado. El tratamiento de IVA
                pendiente deja la oferta en borrador.
              </p>
              <label>
                Capacidad de referencia (m³)
                <input
                  type="number"
                  name="capacity"
                  min="0.001"
                  step="any"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  aria-invalid={Boolean(result?.fields?.["input.capacity"])}
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
                  value={trucks}
                  onChange={(e) => setTrucks(e.target.value)}
                  aria-invalid={Boolean(result?.fields?.["input.trucks"])}
                />
                {error("trucks")}
              </label>
              <label>
                Motivo del ajuste operativo
                <input
                  name="truckReason"
                  value={truckReason}
                  onChange={(e) => setTruckReason(e.target.value)}
                  aria-invalid={Boolean(result?.fields?.["input.truckReason"])}
                />
                {error("truckReason")}
              </label>
            </>
          )}
        </fieldset>
        <fieldset>
          <legend>Precio y condiciones</legend>
          <p>
            Se calculan en servidor con el catálogo compartido de la web. Los
            cambios económicos requieren autorización de esta revisión.
          </p>
          {zone === "samalayuca" && (
            <label>
              Tarifa de flete Samalayuca por camión (MXN)
              <input
                type="number"
                name="freightRate"
                min="0.01"
                step="0.01"
                required
                value={freightRate}
                onChange={(e) => setFreightRate(e.target.value)}
                aria-invalid={Boolean(result?.fields?.["input.freightRate"])}
              />
              {error("freightRate")}
            </label>
          )}
          <label>
            Descuento en concreto y fibra (MXN)
            <input
              type="number"
              name="discount"
              min="0"
              step="0.01"
              required
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              aria-invalid={Boolean(result?.fields?.["input.discount"])}
            />
            {error("discount")}
          </label>
          <label>
            Motivo de excepción económica
            <textarea
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              aria-invalid={Boolean(result?.fields?.["input.reason"])}
            />
            {error("reason")}
          </label>
        </fieldset>
        <div className={styles.livePreview} aria-live="polite">
          <h3 className={styles.previewHeading}>
            {preview?.pending_tax
              ? "Total provisional"
              : "Vista previa del importe"}
          </h3>
          {previewMissing ? (
            <p className={styles.previewProvisional}>
              Total provisional: {previewMissing}
            </p>
          ) : preview?.ok ? (
            <div className={styles.previewAmounts}>
              <p>Subtotal: {money(preview.subtotal ?? 0)}</p>
              <p>
                IVA{preview.pending_tax ? " conocido (flete pendiente)" : ""}:{" "}
                {money(preview.vat ?? 0)}
              </p>
              <p className={styles.previewTotal}>
                Total{preview.pending_tax ? " provisional" : ""}:{" "}
                {money(preview.total ?? 0)} MXN
              </p>
              {preview.pending_tax && (
                <p className={styles.previewWarning}>
                  El flete a Samalayuca tiene IVA pendiente de confirmación.
                </p>
              )}
              {preview.needs_approval && (
                <p className={styles.previewWarning}>
                  Esta cotización requiere autorización de un administrador
                  (descuento o tarifa fuera de catálogo).
                </p>
              )}
            </div>
          ) : previewLoading ? (
            <p>Calculando total…</p>
          ) : null}
        </div>
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

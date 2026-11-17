"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  stageWorkbook,
  promoteImport,
} from "@/app/panel/configuracion/importaciones/actions";
import styles from "./ImportForm.module.scss";
interface Props {
  row?: { id: string; row_hash: string };
  blocked?: boolean;
}
export default function ImportForm({ row, blocked }: Props) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const locked = useRef(false);
  async function run(form: FormData) {
    if (locked.current) return;
    locked.current = true;
    setPending(true);
    try {
      const result = row
        ? await promoteImport(row.id, row.row_hash)
        : await stageWorkbook(form);
      setMessage(result.message);
      router.refresh();
    } catch {
      setMessage("No se pudo guardar. Revisa conexión y permisos.");
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  return (
    <form action={run} className={styles.form}>
      {row ? (
        <label>
          <input type="checkbox" required /> Revisé y concilié esta fila con el
          origen y los pedidos existentes
        </label>
      ) : (
        <>
          <label>
            Fuente XLSX
            <input type="file" accept=".xlsx" name="file" required />
          </label>
          <p>
            Fuente esperada: Registro CEJ Captura (1).xlsx. Las letras
            corresponden a columnas observadas; no se propone un mapeo sin leer
            tu archivo. Se incluyen hojas y filas ocultas. Deja el mapeo vacío
            para inspeccionar.
          </p>
          <label>
            Fila de encabezados
            <input type="number" name="headerRow" min="1" defaultValue="1" />
          </label>
          {(
            [
              ["reference", "Referencia estable"],
              ["customer", "Nombre del cliente"],
              ["phone", "Teléfono"],
              ["volume", "Volumen histórico"],
              ["total", "Total histórico pactado"],
              ["orderedAt", "Fecha/hora con zona explícita"],
              ["address", "Dirección"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label} · letra de columna
              <input name={key} pattern="[A-Z]{1,2}" maxLength={2} />
            </label>
          ))}
        </>
      )}
      <button disabled={pending || blocked}>
        {pending
          ? "Guardando…"
          : row
            ? "Promover fila conciliada"
            : "Guardar vista previa en staging"}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}

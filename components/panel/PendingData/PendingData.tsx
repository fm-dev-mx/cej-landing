import type { PendingItem } from "@/lib/commercial/pending";
import styles from "./PendingData.module.scss";

/** Lists business facts still missing, each marked «Pendiente» with its reason. */
export default function PendingData({
  items,
  title = "Datos pendientes del propietario",
}: {
  items: PendingItem[];
  title?: string;
}) {
  if (!items.length) return null;
  return (
    <section className={styles.pending} aria-label={title}>
      <h2>{title}</h2>
      <p>
        El sistema sigue funcionando sin estos datos; no se completan con
        valores supuestos. La validación con datos reales queda para cuando
        lleguen.
      </p>
      <ul>
        {items.map((p) => (
          <li key={p.key} data-pending={p.key}>
            <span className={styles.badge}>Pendiente</span>{" "}
            <strong>{p.label}</strong>
            <br />
            Motivo: {p.reason}
            <br />
            Efecto: {p.effect}
          </li>
        ))}
      </ul>
    </section>
  );
}

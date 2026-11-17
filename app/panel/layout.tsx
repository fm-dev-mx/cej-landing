import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { panelSession } from "@/lib/commercial/queries";
import { logout, switchCompany } from "./actions";
import styles from "./panel.module.scss";
import { roleLabels } from "@/lib/schemas/internal/order-status";
export const metadata: Metadata = {
  title: "Panel CEJ",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await panelSession();
  return (
    <div className={styles.shell}>
      <div className={styles.content}>
        <a className={styles.skip} href="#panel-content">
          Saltar al contenido
        </a>
        <header className={styles.header}>
          <Image
            src="/logo-horizontal.png"
            width={140}
            height={60}
            alt="CEJ"
            priority
          />
          <span>
            {s.company.name} · {roleLabels[s.role]}
          </span>
          {s.members.length > 1 && (
            <form action={switchCompany}>
              <label>
                Empresa
                <select name="company_id" defaultValue={s.company.id}>
                  {s.members.map((m) => (
                    <option key={m.company_id} value={m.company_id}>
                      {m.company_id === s.company.id
                        ? s.company.name
                        : m.company_id}
                    </option>
                  ))}
                </select>
              </label>
              <button>Cambiar</button>
            </form>
          )}
          <form action={logout}>
            <button>Salir</button>
          </form>
        </header>
        <nav aria-label="Panel CEJ" className={styles.nav}>
          <Link href="/panel/cotizar">Cotizar</Link>
          <Link href="/panel/pedidos">Pedidos</Link>
          <Link href="/panel/agenda">Agenda</Link>
          <Link href="/panel/clientes">Clientes</Link>
          <Link href="/panel">Seguimiento</Link>
          {["owner", "admin"].includes(s.role) && (
            <Link href="/panel/configuracion">Configuración</Link>
          )}
        </nav>
        <main id="panel-content">{children}</main>
      </div>
    </div>
  );
}

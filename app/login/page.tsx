import Link from "next/link";
import { login } from "@/app/panel/actions";
import { panelConfigured } from "@/lib/supabase/server";
import styles from "@/app/panel/panel.module.scss";
export const metadata = {
  title: "Acceso al panel CEJ",
  robots: { index: false, follow: false },
};
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; access?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className={styles.shell}>
      <div className={styles.card}>
        <h1>Acceso al panel CEJ</h1>
        {params.access && (
          <p role="alert">
            Tu cuenta no tiene una membresía activa. Solicita acceso al
            responsable de CEJ.
          </p>
        )}
        {!panelConfigured() ? (
          <p>
            El panel requiere configurar Supabase y las membresías de empresa en
            el servidor. Consulta la guía de ensayo local.
          </p>
        ) : (
          <form action={login}>
            <label>
              Correo
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
              />
            </label>
            <label>
              Contraseña
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <button>Entrar</button>
            {params.error && (
              <p role="alert">
                No se pudo iniciar sesión. Revisa tus credenciales.
              </p>
            )}
          </form>
        )}
        <Link href="/">Volver al sitio público</Link>
      </div>
    </main>
  );
}

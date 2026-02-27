import { Metadata } from "next";
import { LoginForm } from "@/components/Auth";
import styles from "./login.module.scss";

export const metadata: Metadata = {
    title: "Iniciar Sesión | CEJ Pro",
    description: "Acceso administrativo para Concreto y Equipos de Juárez.",
    robots: "noindex, nofollow",
};

export default function LoginPage() {
    return (
        <main className={styles.loginPage}>
            <div className={styles.container}>
                <LoginForm />
            </div>
        </main>
    );
}

// app/(marketing)/terminos/page.tsx
import { Metadata } from "next";
import { BUSINESS_INFO, MIN_M3_BY_TYPE } from "@/config/business";
import styles from "./Terms.module.scss";

export const metadata: Metadata = {
    title: "Términos y Condiciones | CEJ",
    description: "Condiciones de servicio, uso de calculadora y políticas de entrega.",
    robots: "noindex, follow",
};

export default function TermsPage() {
    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Términos y Condiciones de Servicio</h1>
                    <p className={styles.subtitle}>Reglas claras para un servicio excelente.</p>
                </header>

                <section className={styles.content}>

                    {/* CRITICAL: Calculator Disclaimer */}
                    <div className={styles.disclaimerBox}>
                        <h3>⚠️ Aviso Importante sobre la Volumetría</h3>
                        <p>
                            La calculadora digital proporcionada en este sitio web es una herramienta de estimación referencial basada en los datos ingresados por el usuario.
                            <strong> {BUSINESS_INFO.name} no se hace responsable por variaciones de volumen</strong> derivadas de irregularidades en el terreno, deflexión de cimbras, desperdicios en obra o datos de entrada incorrectos.
                        </p>
                        <p>
                            El cliente es el único responsable de verificar las medidas físicas finales en la obra antes de confirmar su pedido. Recomendamos solicitar nuestra visita técnica gratuita para validación.
                        </p>
                    </div>

                    <article>
                        <h2>1. Pedidos y Cantidades Mínimas</h2>
                        <p>
                            Para garantizar la operatividad y calidad del servicio, establecemos los siguientes pedidos mínimos:
                        </p>
                        <ul>
                            <li><strong>Tiro Directo:</strong> Mínimo {MIN_M3_BY_TYPE.direct} m³.</li>
                            <li><strong>Servicio de Bomba:</strong> Mínimo {MIN_M3_BY_TYPE.pumped} m³.</li>
                        </ul>
                        <p>
                            Cualquier pedido por debajo de estas cantidades estará sujeto a disponibilidad y podrá incurrir en cargos adicionales por concepto de &quot;falso flete&quot; o &quot;vacío&quot;, los cuales serán informados al momento de la cotización final.
                        </p>
                    </article>

                    <article>
                        <h2>2. Condiciones de Entrega y Acceso</h2>
                        <p>
                            Es responsabilidad del cliente asegurar que el sitio de la obra cuente con los accesos necesarios y seguros para unidades pesadas (ollas revolvedoras y bombas).
                        </p>
                        <ul>
                            <li><strong>Cables y Alturas:</strong> Verificar que no existan cables de baja tensión o estructuras que impidan la operación de la pluma.</li>
                            <li><strong>Terreno:</strong> El suelo debe estar compactado para soportar el peso de las unidades.</li>
                            <li><strong>Permisos:</strong> El cliente debe gestionar cualquier permiso municipal necesario para el bloqueo parcial de calles durante el colado.</li>
                        </ul>
                        <p>
                            Si la unidad llega al sitio y no puede acceder o tirar el concreto por causas imputables al cliente, se cobrará el concreto como entregado más los costos de retorno y disposición ecológica.
                        </p>
                    </article>

                    <article>
                        <h2>3. Pagos y Cancelaciones</h2>
                        <p>
                            Los pedidos deben ser liquidados antes de la descarga del material, salvo acuerdo previo por escrito. Aceptamos transferencias electrónicas, depósitos y efectivo.
                        </p>
                        <p>
                            Las cancelaciones o reprogramaciones deben realizarse con al menos <strong>24 horas de anticipación</strong>. Cancelaciones el mismo día del colado pueden generar cargos por gastos operativos ya incurridos.
                        </p>
                    </article>

                    <article>
                        <h2>4. Jurisdicción</h2>
                        <p>
                            Para la interpretación y cumplimiento de los presentes términos, las partes se someten a la jurisdicción de los tribunales competentes en <strong>{BUSINESS_INFO.address.city}, {BUSINESS_INFO.address.region}</strong>, renunciando a cualquier otro fuero que pudiera corresponderles por razón de sus domicilios presentes o futuros.
                        </p>
                    </article>

                </section>
            </div>
        </div>
    );
}

import { Metadata } from "next";
import { BUSINESS_INFO } from "@/config/business";
import { env } from "@/config/env";
import styles from "./Privacy.module.scss";

export const metadata: Metadata = {
    title: "Aviso de Privacidad | CEJ",
    description: "Política de tratamiento de datos personales y uso de cookies.",
    robots: "index, follow", // Change to index once content is final
};

export default function PrivacyPage() {
    const { name, address, email } = BUSINESS_INFO;
    const fullAddress = `${address.street}, ${address.colony}, ${address.postalCode}, ${address.city}, ${address.region}, ${address.country}.`;

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Aviso de Privacidad Integral</h1>
                    <p className={styles.lastUpdated}>Última actualización: Diciembre 2025</p>
                </header>

                <section className={styles.content}>
                    <p className={styles.intro}>
                        <strong>{name}</strong> (en adelante "El Responsable"), con domicilio en <strong>{fullAddress}</strong>,
                        es el responsable del uso y protección de sus datos personales, y al respecto le informamos lo siguiente:
                    </p>

                    <article>
                        <h2>1. ¿Para qué fines utilizaremos sus datos personales?</h2>
                        <p>Los datos personales que recabamos de usted los utilizaremos para las siguientes finalidades que son necesarias para el servicio que solicita:</p>
                        <ul>
                            <li>Cotización, venta y suministro de concreto premezclado.</li>
                            <li>Logística de entrega y prestación de servicios de bombeo.</li>
                            <li>Facturación y cobranza.</li>
                            <li>Contacto vía mensajería instantánea (WhatsApp) para coordinación de pedidos.</li>
                        </ul>
                        <p>De manera adicional, utilizaremos su información personal para las siguientes finalidades <strong>secundarias</strong> que nos permiten y facilitan brindarle una mejor atención:</p>
                        <ul>
                            <li>Mercadotecnia publicitaria y prospección comercial.</li>
                            <li>Análisis estadístico de tráfico web y conversión.</li>
                        </ul>
                    </article>

                    <article>
                        <h2>2. Datos Personales Recabados</h2>
                        <p>Para llevar a cabo las finalidades descritas en el presente aviso de privacidad, utilizaremos los siguientes datos personales:</p>
                        <ul>
                            <li>Datos de identificación: Nombre completo.</li>
                            <li>Datos de contacto: Teléfono móvil, correo electrónico (opcional).</li>
                            <li>Datos de navegación: Dirección IP, Agente de Usuario (navegador), Cookies de sesión.</li>
                        </ul>
                    </article>

                    <article>
                        <h2>3. Transferencia de Datos y Tecnologías de Rastreo (Meta CAPI)</h2>
                        <p>
                            Le informamos que en nuestra página de Internet utilizamos cookies, web beacons y otras tecnologías a través de las cuales es posible monitorear su comportamiento como usuario de Internet.
                        </p>
                        <p>
                            <strong>Uso de API de Conversiones (Server-Side):</strong> Compartimos información seudominizada (protegida mediante cifrado SHA-256) con socios tecnológicos, específicamente <strong>Meta Platforms, Inc.</strong>, con la finalidad de medir la efectividad de nuestra publicidad y mejorar la experiencia de usuario. Estos datos incluyen identificadores como correo electrónico o teléfono hasheados, dirección IP y cookies de navegador (<em>_fbp</em>, <em>_fbc</em>).
                        </p>
                    </article>

                    <article>
                        <h2>4. Derechos ARCO</h2>
                        <p>
                            Usted tiene derecho a conocer qué datos personales tenemos de usted, para qué los utilizamos y las condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección de su información personal en caso de que esté desactualizada, sea inexacta o incompleta (Rectificación); que la eliminemos de nuestros registros o bases de datos cuando considere que la misma no está siendo utilizada adecuadamente (Cancelación); así como oponerse al uso de sus datos personales para fines específicos (Oposición).
                        </p>
                        <p>
                            Para el ejercicio de cualquiera de los derechos ARCO, usted deberá presentar la solicitud respectiva enviando un correo electrónico a: <strong><a href={`mailto:${email}`}>{email}</a></strong>.
                        </p>
                    </article>
                </section>
            </div>
        </div>
    );
}

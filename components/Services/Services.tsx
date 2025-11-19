// components/Services/Services.tsx
import styles from "./Services.module.scss";

interface ServiceItem {
  id: string;
  title: string;
  desc: string;
  icon: string;
  ariaLabel: string; // Accessibility improvement
}

const SERVICES: ServiceItem[] = [
  {
    id: "concreto",
    title: "Concreto Premezclado",
    desc: "Desde f’c 100 hasta 350 kg/cm². Calidad controlada y mezclas especiales para losas, pisos y estructuras.",
    icon: "🏗️",
    ariaLabel: "Grúa de construcción",
  },
  {
    id: "bomba",
    title: "Servicio de Bombeo",
    desc: "Bombas pluma y estacionarias para llegar a cualquier rincón de tu obra. Eficiencia y limpieza garantizada.",
    icon: "🚛",
    ariaLabel: "Camión de transporte",
  },
  {
    id: "asesoria",
    title: "Asesoría Técnica",
    desc: "No adivines. Nuestros expertos te ayudan a calcular volúmenes y elegir la resistencia adecuada sin costo.",
    icon: "👷",
    ariaLabel: "Trabajador de construcción",
  },
];

export default function Services() {
  return (
    <section id="services" className={`${styles.section} section`}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            Todo lo que necesitas, <br />
            <span>en un solo lugar.</span>
          </h2>
          <p className={styles.subtitle}>
            Soluciones integrales de concreto para contratistas y constructores en Ciudad Juárez.
          </p>
        </div>

        <div className={styles.grid}>
          {SERVICES.map((s) => (
            <article key={s.id} className={styles.card}>
              <div className={styles.iconWrapper}>
                <span
                  className={styles.icon}
                  role="img"
                  aria-label={s.ariaLabel}
                >
                  {s.icon}
                </span>
              </div>
              <h3 className={styles.cardTitle}>{s.title}</h3>
              <p className={styles.cardDesc}>{s.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

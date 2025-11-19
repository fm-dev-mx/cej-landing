import styles from "./ServiceArea.module.scss";

export default function ServiceArea() {
  // Keep this URL in sync with the published Google My Maps configuration
  const mapSrc =
    "https://www.google.com/maps/d/embed?mid=1AqcIOl3mMwAF5WUFcRGpSEDDyuiNqv4&ehbc=2E312F";

  return (
    <section id="service-area" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.content}>
            <h2 className={styles.title}>Ubicación y Cobertura</h2>
            <p className={styles.description}>
              Visítanos en nuestras oficinas o contáctanos para programar tu pedido.
            </p>

            <ul className={styles.list}>
              <li className={styles.listItem}>
                <span className={styles.icon}>🏢</span>
                <span>
                  <strong>Oficinas Centrales:</strong> <br />
                  Centro Comercial San José, Local 27 <br />
                  Av. Ejército Nacional 6225, Ciudad Juárez, Chihuahua, <br />
                  a unos metros de Plaza Juárez Mall.
                </span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.icon}>📍</span>
                <span>
                  <strong>Zona de Servicio (Área gris):</strong> <br />
                  Cubrimos toda la mancha urbana mostrada en el mapa.
                </span>
              </li>
              <li className={styles.listItem}>
                <span className={styles.icon}>🚚</span>
                <span>
                  <strong>Zona Extendida:</strong> <br />
                  Para obras fuera del área marcada (Samalayuca, Anapra, etc.),
                  contáctanos para verificar viabilidad por volumen.
                </span>
              </li>
            </ul>

            <div className={styles.note}>
              <p>
                <strong>Horario de Atención:</strong> <br />
                Lunes a Viernes de 8:00 AM a 6:00 PM <br />
                Sábados de 8:00 AM a 1:00 PM
              </p>
            </div>
          </div>

          <div className={styles.mapWrapper}>
            <iframe
              src={mapSrc}
              title="Ubicación y zona de servicio CEJ"
              className={styles.mapFrame}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

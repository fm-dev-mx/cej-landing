// components/ServiceArea/ServiceArea.tsx
"use client";

import { useState, useMemo } from "react";
import { env } from "@/config/env";
import { getPhoneUrl, getWhatsAppUrl } from "@/lib/utils";
import styles from "./ServiceArea.module.scss";

export default function ServiceArea() {
  const [isMapActive, setIsMapActive] = useState(false);

  // Corrected to HTTPS to prevent mixed content warnings
  const mapSrc = "https://www.google.com/maps/d/embed?mid=1AqcIOl3mMwAF5WUFcRGpSEDDyuiNqv4&ehbc=2E312F";

  const phone = env.NEXT_PUBLIC_PHONE;
  const whatsapp = env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const email = "contacto@concretodejuarez.com";

  const links = useMemo(() => ({
    phone: getPhoneUrl(phone),
    whatsapp: getWhatsAppUrl(whatsapp)
  }), [phone, whatsapp]);

  // Local SEO Coverage Zones for indexation
  const coverageZones = [
    "Valle del Sol", "Campos Elíseos", "Zona Pronaf", "San Lorenzo",
    "Partido Raza", "Salvarcar", "Parque Industrial Gema", "Parque Industrial Omega",
    "Satélite", "Las Torres", "Ejército Nacional", "Gómez Morín"
  ];

  return (
    <section id="service-area" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.content}>
            <header>
              <h2 className={styles.title}>Ubicación y Cobertura</h2>
              <p className={styles.description}>
                Abastecemos obras en todo Ciudad Juárez. Desde el centro hasta los nuevos desarrollos industriales.
              </p>
            </header>

            <ul className={styles.contactList}>
              {/* 1. OFFICES */}
              <li className={styles.contactItem}>
                <div className={styles.iconBox} aria-hidden="true">🏢</div>
                <div className={styles.itemText}>
                  <strong>Oficinas Centrales</strong>
                  <address className={styles.address}>
                    Centro Comercial San José, Local 27 <br />
                    Av. Ejército Nacional 6225, Ciudad Juárez, Chih.
                  </address>
                </div>
              </li>

              {/* 2. CONTACT */}
              <li className={styles.contactItem}>
                <div className={styles.iconBox} aria-hidden="true">📞</div>
                <div className={styles.itemText}>
                  <strong>Atención Inmediata</strong>
                  <div className={styles.linksStack}>
                    {phone && links.phone && (
                      <a href={links.phone} className={styles.textLink}>
                        {phone} <span className={styles.linkLabel}>(Llamadas)</span>
                      </a>
                    )}
                    {whatsapp && links.whatsapp && (
                      <a
                        href={links.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.textLink}
                      >
                        Enviar WhatsApp
                      </a>
                    )}
                    <a href={`mailto:${email}`} className={styles.textLink}>
                      {email}
                    </a>
                  </div>
                </div>
              </li>

              {/* 3. ZONES */}
              <li className={styles.contactItem}>
                <div className={styles.iconBox} aria-hidden="true">📍</div>
                <div className={styles.itemText}>
                  <strong>Zonas de Entrega Frecuente</strong>
                  <p className={styles.zoneList}>
                    {coverageZones.join(" • ")} y más.
                  </p>
                  <span className={styles.linkLabel}>
                    ¿Tu obra está en Samalayuca o Anapra? Contáctanos para cotizar flete especial.
                  </span>
                </div>
              </li>
            </ul>

            {/* 4. SCHEDULE */}
            <div className={styles.scheduleCard}>
              <h3 className={styles.scheduleTitle}>Horario de Planta</h3>
              <div className={styles.scheduleRow}>
                <span>Lunes a Viernes</span>
                <strong>8:00 AM — 5:00 PM</strong>
              </div>
              <div className={styles.scheduleRow}>
                <span>Sábados</span>
                <strong>8:00 AM — 1:00 PM</strong>
              </div>
            </div>
          </div>


          <div className={`${styles.mapWrapper} ${isMapActive ? styles.active : ""}`}>
            {!isMapActive && (
              <button
                type="button"
                className={styles.mapOverlay}
                onClick={() => setIsMapActive(true)}
                aria-label="Ver mapa interactivo"
              >
                <div className={styles.overlayContent}>
                  <span className={styles.overlayIcon} aria-hidden="true">🗺️</span>
                  <span className={styles.overlayText}>Ver ubicación en mapa</span>
                </div>
              </button>
            )}
            <iframe
              src={mapSrc}
              title="Ubicación CEJ Concreto"
              className={styles.mapFrame}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

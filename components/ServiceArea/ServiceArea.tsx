// components/ServiceArea/ServiceArea.tsx
"use client";

import { useState } from "react";
import { env } from "@/config/env";
import styles from "./ServiceArea.module.scss";

export default function ServiceArea() {
  const [isMapActive, setIsMapActive] = useState(false);

  // Corrected to HTTPS to prevent mixed content warnings
  const mapSrc = "https://www.google.com/maps/d/embed?mid=1AqcIOl3mMwAF5WUFcRGpSEDDyuiNqv4&ehbc=2E312F";

  const phone = env.NEXT_PUBLIC_PHONE;
  const whatsapp = env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const email = "contacto@concretodejuarez.com";

  // Helper to sanitize phone numbers for href (removes spaces, dashes, etc.)
  const sanitizePhone = (num: string) => num.replace(/[^\d+]/g, "");

  return (
    <section id="service-area" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.content}>
            <h2 className={styles.title}>Ubicación y Contacto</h2>
            <p className={styles.description}>
              Visítanos, llámanos o escríbenos. Tu obra no espera y nosotros
              tampoco.
            </p>

            <ul className={styles.contactList}>
              {/* 1. OFFICES */}
              <li className={styles.contactItem}>
                <div className={styles.iconBox} aria-hidden="true">
                  🏢
                </div>
                <div className={styles.itemText}>
                  <strong>Oficinas Centrales</strong>
                  <address className={styles.address}>
                    Centro Comercial San José, Local 27 <br />
                    Av. Ejército Nacional 6225, Ciudad Juárez, Chih.
                  </address>
                </div>
              </li>

              {/* 2. DIRECT CONTACT */}
              <li className={styles.contactItem}>
                <div className={styles.iconBox} aria-hidden="true">
                  📞
                </div>
                <div className={styles.itemText}>
                  <strong>Canales Directos</strong>
                  <div className={styles.linksStack}>
                    {phone && (
                      <a
                        href={`tel:${sanitizePhone(phone)}`}
                        className={styles.textLink}
                      >
                        {phone}{" "}
                        <span className={styles.linkLabel}>(Llamadas)</span>
                      </a>
                    )}
                    {whatsapp && (
                      <a
                        href={`https://wa.me/${whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.textLink}
                      >
                        {whatsapp}{" "}
                        <span className={styles.linkLabel}>(WhatsApp)</span>
                      </a>
                    )}
                    <a href={`mailto:${email}`} className={styles.textLink}>
                      {email}
                    </a>
                  </div>
                </div>
              </li>

              {/* 3. SERVICE AREA */}
              <li className={styles.contactItem}>
                <div className={styles.iconBox} aria-hidden="true">
                  📍
                </div>
                <div className={styles.itemText}>
                  <strong>Zona de Servicio</strong>
                  Cubrimos el area gris mostrada en el mapa.
                  <span className={styles.linkLabel}>Para obras fuera del área (Samalayuca, Anapra, etc.), <br />
                  contáctanos para verificar viabilidad por volumen.</span>

                </div>
              </li>
            </ul>

            {/* SCHEDULE */}
            <div className={styles.scheduleCard}>
              <h3 className={styles.scheduleTitle}>Horario de Atención</h3>
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

          {/* MAP WRAPPER */}
          <div
            className={`${styles.mapWrapper} ${
              isMapActive ? styles.active : ""
            }`}
          >
            {!isMapActive && (
              <button
                type="button"
                className={styles.mapOverlay}
                onClick={() => setIsMapActive(true)}
                aria-label="Activar mapa interactivo"
              >
                <div className={styles.overlayContent}>
                  <span className={styles.overlayIcon} aria-hidden="true">
                    🗺️
                  </span>
                  <span className={styles.overlayText}>
                    Ver mapa interactivo
                  </span>
                  <span className={styles.overlayHint}>
                    (Clic para activar)
                  </span>
                </div>
              </button>
            )}
            <iframe
              src={mapSrc}
              title="Zona de cobertura CEJ"
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

'use client';
import styles from './cta.module.scss';
export default function CTAButtons(){
  return (
    <div className={styles.bar} role="toolbar" aria-label="Contactar CEJ">
      <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}`} >WhatsApp</a>
      <a href={`tel:${process.env.NEXT_PUBLIC_PHONE}`}>Llamar</a>
    </div>
  );
}

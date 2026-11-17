"use client";
import { useState } from "react";
import styles from "./QuoteExports.module.scss";
interface Props {
  text: string;
  url: string;
}
export default function QuoteExports({ text, url }: Props) {
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Texto copiado.");
    } catch {
      setMessage(
        "No se pudo copiar. Selecciona y copia el texto de la cotización.",
      );
    }
  }
  return (
    <>
      <div className={styles.actions}>
        <button onClick={copy}>Copiar texto</button>
        <a href={`${url}?format=pdf`}>Descargar PDF</a>
        <a href={`${url}?format=png`}>Descargar imagen</a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Preparar WhatsApp
        </a>
      </div>
      <p>Compartir prepara el texto; el operador completa el envío.</p>
      <p role="status">{message}</p>
    </>
  );
}

"use client";
export default function ErrorBoundary({ reset }: { reset: () => void }) {
  return (
    <section>
      <h1>No pudimos cargar los datos</h1>
      <p role="alert">
        Revisa la conexión y tus permisos de empresa. No se confirmó ningún
        cambio desde esta pantalla.
      </p>
      <button onClick={reset}>Intentar de nuevo</button>
    </section>
  );
}

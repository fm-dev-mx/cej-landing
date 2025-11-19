// app/page.tsx

import Calculator from '@/components/Calculator/Calculator';
import CTAButtons from "@/components/CTAButtons/CTAButtons";
import HeroSection from "@/components/layout/HeroSection";
import Services from '@/components/Services/Services';

export const metadata = {
  title: 'Concreto y Equipos de Juárez | Cotizador al instante',
  description: 'Cotiza concreto premezclado en Ciudad Juárez en segundos. Calidad, resistencia y entrega puntual para tu obra.'
};

export default function Page() {
  return (
    <main>
      <HeroSection />

      {/* Calculator Section with Dark Glass Integration */}
      {/* The wrapper background handles the visual transition from the Hero */}
      <div id="calculator">
        <Calculator />
      </div>

      <Services />

      {/* Placeholder: Coverage Section */}
      <section id="coverage" className="section bgLight">
        <div className="containerCentered">
           <h2 className="h2" style={{ color: 'var(--c-text)' }}>Cobertura en Ciudad Juárez</h2>
           <p className="textMuted">
             Llegamos a todas las zonas de la ciudad y alrededores. (Mapa próximamente)
           </p>
        </div>
      </section>

      {/* Placeholder: FAQ Section */}
      <section id="faq" className="section bgWhite">
        <div className="containerCentered">
           <h2 className="h2" style={{ color: 'var(--c-text)' }}>Preguntas Frecuentes</h2>
           <p className="textMuted">
             Resolvemos tus dudas sobre tiempos de entrega y tipos de concreto.
           </p>
        </div>
      </section>

      <CTAButtons
        whatsappNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''}
        phoneNumber={process.env.NEXT_PUBLIC_PHONE ?? ''}
        quoteText="Hola, quiero una cotización de concreto."
      />
    </main>
  );
}

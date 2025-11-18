// app/page.tsx

import Calculator from '@/components/Calculator/Calculator';
import CTAButtons from "@/components/CTAButtons/CTAButtons";
import HeroSection from "@/components/layout/HeroSection";

export const metadata = {
  title: 'Concreto y Equipos de Juárez | Cotizador al instante',
  description: 'Cotiza concreto premezclado en Ciudad Juárez en segundos. Calidad, resistencia y entrega puntual para tu obra.'
};

export default function Page() {
  return (
    <main>
      {/* Hero manages its own content via default props, easier to maintain */}
      <HeroSection />

      {/* Anchor ID matches the Hero button href="#calculator" */}
      <div id="calculator">
        <Calculator />
      </div>

      <CTAButtons
        whatsappNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''}
        phoneNumber={process.env.NEXT_PUBLIC_PHONE ?? ''}
        quoteText="Hola, quiero una cotización de concreto."
      />
    </main>
  );
}

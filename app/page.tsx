// app/page.tsx

import Calculator from '@/components/Calculator/Calculator';
import CTAButtons from "@/components/CTAButtons/CTAButtons";
import HeroSection from "@/components/layout/HeroSection";
import Services from '@/components/Services/Services';
import FAQ from '@/components/FAQ/FAQ';
import ServiceArea from '@/components/ServiceArea/ServiceArea';

export const metadata = {
  title: 'Concreto y Equipos de Juárez | Cotizador al instante',
  description: 'Cotiza concreto premezclado en Ciudad Juárez en segundos. Calidad, resistencia y entrega puntual para tu obra.'
};

export default function Page() {
  return (
    <main>
      <HeroSection />

      {/* Calculator Section with Dark Glass Integration */}
      <div id="calculator">
        <Calculator />
      </div>

      <Services />

      {/* Nueva sección de mapa */}
      <ServiceArea />

      <FAQ />

      <CTAButtons
        whatsappNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''}
        phoneNumber={process.env.NEXT_PUBLIC_PHONE ?? ''}
        quoteText="Hola, quiero una cotización de concreto."
      />
    </main>
  );
}

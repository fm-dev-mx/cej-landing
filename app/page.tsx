// app/page.tsx

import Calculator from '@/components/Calculator/Calculator';
import CTAButtons from "@/components/CTAButtons/CTAButtons";
import HeroSection from "@/components/layout/HeroSection";
import TrustSection from "@/components/TrustSection/TrustSection";
import ProcessSection from "@/components/ProcessSection/ProcessSection";
import Services from '@/components/Services/Services';
import FAQ from '@/components/FAQ/FAQ';
import ServiceArea from '@/components/ServiceArea/ServiceArea';
import { env } from '@/config/env';

export const metadata = {
  title: `${env.NEXT_PUBLIC_BRAND_NAME} | Cotizador al instante`,
  description: 'Cotiza concreto premezclado en Ciudad Juárez en segundos. Calidad, resistencia y entrega puntual para tu obra.'
};

export default function Page() {
  return (
    <main>
      <HeroSection />

      {/* Trust Signals / Social Proof */}
      <TrustSection />

      {/* Calculator Hook */}
      <div id="calculator">
        <Calculator />
      </div>

      {/* Point 3: Purchase Process (How it works)
          Connects the tool (Calculator) with the actual action (Purchase).
      */}
      <ProcessSection />

      <Services />

      <ServiceArea />

      <FAQ />

      <CTAButtons
        whatsappNumber={env.NEXT_PUBLIC_WHATSAPP_NUMBER}
        phoneNumber={env.NEXT_PUBLIC_PHONE}
        quoteText="Hola, quiero una cotización de concreto."
      />
    </main>
  );
}

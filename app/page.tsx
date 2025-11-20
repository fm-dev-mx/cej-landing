// app/page.tsx

import Calculator from '@/components/Calculator/Calculator';
import CTAButtons from "@/components/CTAButtons/CTAButtons";
import HeroSection from "@/components/layout/HeroSection";
import TrustSection from "@/components/TrustSection/TrustSection";
import ProcessSection from "@/components/ProcessSection/ProcessSection";
import SocialProofSection from "@/components/SocialProofSection/SocialProofSection"; // NEW
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

      {/* 1. Trust Signals: Immediate reassurance after Hero */}
      <TrustSection />

      {/* 2. The Tool: Core Value Prop */}
      <div id="calculator">
        <Calculator />
      </div>

      {/* 3. Process: How it works (rational) */}
      <ProcessSection />

      {/* 4. Social Proof: Tangible Evidence (emotional/trust) - NEW */}
      <SocialProofSection />

      {/* 5. Services: Detail of what we sell */}
      <Services />

      {/* 6. Logistics & Support */}
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

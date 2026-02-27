import Calculator from '@/components/Calculator/Calculator';
import CTAButtons from "@/components/CTAButtons/CTAButtons";
import HeroSection from "@/components/layouts/HeroSection";
import TrustSection from "@/components/TrustSection/TrustSection";
import ProcessSection from "@/components/ProcessSection/ProcessSection";
import SocialProofSection from "@/components/SocialProofSection/SocialProofSection";
import Services from '@/components/Services/Services';
import FAQ from '@/components/FAQ/FAQ';
import ServiceArea from '@/components/ServiceArea/ServiceArea';
import { env } from '@/config/env';

export default function Page() {
  return (
    <>
      <HeroSection />
      <TrustSection />
      <div id="calculator">
        <Calculator />
      </div>
      <ProcessSection />
      <SocialProofSection />
      <Services />
      <ServiceArea />
      <FAQ />
      <CTAButtons
        whatsappNumber={env.NEXT_PUBLIC_WHATSAPP_NUMBER}
        quoteText="Hola, quiero una cotización de concreto."
        scheduleHref="#calculator"
      />
    </>
  );
}

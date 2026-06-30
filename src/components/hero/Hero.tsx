import HeroBackground from "./HeroBackground";
import HeroContent from "./HeroContent";
import HeroDashboard from "./HeroDashboard";

import Spotlight from "@/components/ui/spotlight";
import AuroraBackground from "@/components/ui/aurora-background";
import FloatingParticles from "@/components/ui/floating-particles";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden">

      <HeroBackground />

      <AuroraBackground />

      <Spotlight />

      <FloatingParticles />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-between gap-16 px-6 py-24 lg:flex-row">

        <div className="w-full lg:w-1/2">
          <HeroContent />
        </div>

        <div className="flex w-full justify-center lg:w-1/2">
          <HeroDashboard />
        </div>

      </div>

    </section>
  );
}
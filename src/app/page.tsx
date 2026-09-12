import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { MarketSidesSection } from "@/components/MarketSidesSection";
import { ComparisonSection } from "@/components/ComparisonSection";
import { ChainSection } from "@/components/ChainSection";
import { RiskSection } from "@/components/RiskSection";
import { LessonsSection } from "@/components/LessonsSection";
import { TransparencySection } from "@/components/TransparencySection";
import { RoadmapSection } from "@/components/RoadmapSection";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="relative">
      <Header />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <MarketSidesSection />
        <ComparisonSection />
        <ChainSection />
        <RiskSection />
        <LessonsSection />
        <TransparencySection />
        <RoadmapSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

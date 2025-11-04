import { SEOHead } from '@/components/landing/seo-head';
import {
  TopBar,
  Navbar,
  Hero,
  Problem,
  Solution,
  HowItWorks,
  Benefits,
  Features,
  Providers,
  Science,
  PilotResults,
  Testimonials,
  Pricing,
  FAQ,
  FinalCTA,
  Footer,
} from '@/components/landing/sections';

export default function LandingPage() {
  return (
    <>
      <SEOHead />
      <div className="min-h-screen bg-background">
        <TopBar />
        <Navbar />
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <Benefits />
        <Features />
        <Providers />
        <Science />
        <PilotResults />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
        <Footer />
      </div>
    </>
  );
}


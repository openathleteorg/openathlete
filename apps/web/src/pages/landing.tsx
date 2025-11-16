import {
  Benefits,
  FAQ,
  Features,
  FinalCTA,
  Footer,
  Hero,
  HowItWorks,
  Navbar,
  PilotResults,
  Pricing,
  Problem,
  Providers,
  Science,
  Solution,
  Testimonials,
  TopBar,
} from '@/components/landing/sections';
import { SEOHead } from '@/components/landing/seo-head';

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

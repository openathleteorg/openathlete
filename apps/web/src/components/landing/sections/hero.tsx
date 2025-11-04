import { Button } from '@/components/ui/button';
import { Container } from '@/components/landing/container';
import { Stat } from '@/components/landing/stat';
import { RequestAccessModal } from '@/components/landing/request-access-modal';
import { ImagePlaceholder } from '@/components/landing/image-placeholder';
import { m } from '@/paraglide/messages';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

export function Hero() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800 dark:[mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
        <Container>
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              {m.landing_hero_title()}
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
              {m.landing_hero_subtitle()}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={() => setModalOpen(true)}
                className="group"
              >
                {m.landing_hero_cta_primary()}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
              >
                <a href="#how-it-works">{m.landing_hero_cta_secondary()}</a>
              </Button>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <Stat value={m.landing_hero_proof_1()} />
              <Stat value={m.landing_hero_proof_2()} />
              <Stat value={m.landing_hero_proof_3()} />
            </div>

            <div className="mt-12">
              <p className="text-sm text-muted-foreground">
                {m.landing_integrations_note()}
              </p>
            </div>
          </div>

          {/* Hero Image - Dashboard screenshot or platform overview */}
          <div className="mt-20">
            <ImagePlaceholder
              description="Screenshot du tableau de bord principal OpenAthlete montrant un aperçu de la plateforme : calendrier d'entraînement, métriques de charge, alertes de fatigue. Vue d'ensemble moderne et claire, ton professionnel."
              aspectRatio="16/9"
            />
          </div>
        </Container>
      </section>

      <RequestAccessModal
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}


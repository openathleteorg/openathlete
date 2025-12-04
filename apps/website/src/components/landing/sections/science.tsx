import { Container } from '@/components/landing/container';
import { Section } from '@/components/landing/section';
import { m } from '@/paraglide/messages';

export function Science() {
  return (
    <Section id="science">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {m.landing_science_title()}
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {m.landing_science_text()}
          </p>
        </div>

        {/* <div className="mt-16">
          <ImagePlaceholder
            description="Visualisation scientifique : graphiques de métriques (charge, HRV, sommeil, dérive cardiaque) avec annotations montrant comment l'IA détecte les patterns. Style data-viz moderne et professionnel, avec des couleurs sobres."
            aspectRatio="16/9"
            className="max-w-4xl mx-auto"
          />
        </div> */}
      </Container>
    </Section>
  );
}

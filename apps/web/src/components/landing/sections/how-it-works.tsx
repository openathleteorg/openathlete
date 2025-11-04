import { Container } from '@/components/landing/container';
import { ImagePlaceholder } from '@/components/landing/image-placeholder';
import { Section } from '@/components/landing/section';
import { StepItem } from '@/components/landing/step-item';
import { m } from '@/paraglide/messages';

export function HowItWorks() {
  const steps = [
    { step: 1, description: m.landing_how_step_1() },
    { step: 2, description: m.landing_how_step_2() },
    { step: 3, description: m.landing_how_step_3() },
    { step: 4, description: m.landing_how_step_4() },
    { step: 5, description: m.landing_how_step_5() },
  ];

  return (
    <Section id="how-it-works" className="bg-muted/30">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {m.landing_how_title()}
          </h2>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <div className="space-y-8">
            {steps.map((stepData) => (
              <StepItem
                key={stepData.step}
                step={stepData.step}
                title={m.landing_how_step_label({ num: stepData.step })}
                description={stepData.description}
              />
            ))}
          </div>
        </div>

        {/* How it works - Workflow visualization */}
        <div className="mt-16">
          <ImagePlaceholder
            description="Infographie ou diagramme montrant le workflow OpenAthlete : de la connexion des données à l'analyse IA, jusqu'aux recommandations. Flux visuel clair avec flèches/étapes, style moderne et épuré."
            aspectRatio="16/9"
            className="max-w-4xl mx-auto"
          />
        </div>
      </Container>
    </Section>
  );
}

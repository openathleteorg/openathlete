import { Container } from '@/components/landing/container';
import { Section } from '@/components/landing/section';
import { m } from '@/paraglide/messages';
import { CheckCircle2, Sparkles, TrendingUp, Zap } from 'lucide-react';

export function CoachesWorkflow() {
  const steps = [
    {
      title: m.coaches_workflow_step_1(),
      Icon: Sparkles,
    },
    {
      title: m.coaches_workflow_step_2(),
      Icon: Zap,
    },
    {
      title: m.coaches_workflow_step_3(),
      Icon: CheckCircle2,
    },
    {
      title: m.coaches_workflow_step_4(),
      Icon: TrendingUp,
    },
  ];

  return (
    <Section id="workflow">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {m.coaches_workflow_title()}
          </h2>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2">
            {steps.map(({ title, Icon }, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-70" />

                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-background">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold leading-6">{title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}


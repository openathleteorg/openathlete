import { Container } from '@/components/landing/container';
import { Section } from '@/components/landing/section';
import { m } from '@/paraglide/messages';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import * as React from 'react';

export function Problem() {
  const points = [
    m.landing_problem_point_1(),
    m.landing_problem_point_2(),
    m.landing_problem_point_3(),
  ];

  return (
    <Section id="problem" className="bg-muted/30">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {m.landing_problem_title()}
          </h2>
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-center">
            {points.map((point, index) => (
              <React.Fragment key={index}>
                <div className="flex gap-3 rounded-lg border bg-card p-6">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                  <p className="text-sm leading-relaxed">{point}</p>
                </div>
                {index < points.length - 1 && (
                  <ArrowRight className="hidden md:block h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

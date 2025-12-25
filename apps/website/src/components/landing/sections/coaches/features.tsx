import { Container } from '@/components/landing/container';
import { Section } from '@/components/landing/section';
import { m } from '@/paraglide/messages';
import {
  AlertTriangle,
  BarChart3,
  MessageSquare,
  Sparkles,
  Upload,
} from 'lucide-react';

export function CoachesFeatures() {
  const features = [
    {
      title: m.coaches_features_card_1_title(),
      description: m.coaches_features_card_1_desc(),
      Icon: Sparkles,
    },
    {
      title: m.coaches_features_card_2_title(),
      description: m.coaches_features_card_2_desc(),
      Icon: AlertTriangle,
    },
    {
      title: m.coaches_features_card_3_title(),
      description: m.coaches_features_card_3_desc(),
      Icon: BarChart3,
    },
    {
      title: m.coaches_features_card_4_title(),
      description: m.coaches_features_card_4_desc(),
      Icon: Sparkles,
    },
    {
      title: m.coaches_features_card_5_title(),
      description: m.coaches_features_card_5_desc(),
      Icon: MessageSquare,
    },
    {
      title: m.coaches_features_card_6_title(),
      description: m.coaches_features_card_6_desc(),
      Icon: Upload,
    },
  ];

  return (
    <Section id="features" className="bg-muted/30">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {m.coaches_features_title()}
          </h2>
        </div>

        <div className="mx-auto mt-16 max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ title, description, Icon }, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-70" />

                <div className="relative">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border bg-background">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

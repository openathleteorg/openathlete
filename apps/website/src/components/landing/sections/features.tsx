import featuresImage from '@/assets/images/landing/stats.png';
import { Container } from '@/components/landing/container';
import { FeatureCard } from '@/components/landing/feature-card';
import { ImagePlaceholder } from '@/components/landing/image-placeholder';
import { Section } from '@/components/landing/section';
import { m } from '@/paraglide/messages';
import {
  Activity,
  Bell,
  BookOpen,
  Lightbulb,
  Link as LinkIcon,
  Target,
} from 'lucide-react';

const icons = [Activity, Bell, Lightbulb, BookOpen, Target, LinkIcon];

export function Features() {
  const features = [
    {
      title: m.landing_features_card_1_title(),
      description: m.landing_features_card_1_desc(),
    },
    {
      title: m.landing_features_card_2_title(),
      description: m.landing_features_card_2_desc(),
    },
    {
      title: m.landing_features_card_3_title(),
      description: m.landing_features_card_3_desc(),
    },
    {
      title: m.landing_features_card_4_title(),
      description: m.landing_features_card_4_desc(),
    },
    {
      title: m.landing_features_card_5_title(),
      description: m.landing_features_card_5_desc(),
    },
    {
      title: m.landing_features_card_6_title(),
      description: m.landing_features_card_6_desc(),
    },
  ];

  return (
    <Section id="features" className="bg-muted/30">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {m.landing_features_title()}
          </h2>
        </div>

        {/* Feature showcase image - Split screen or collage */}
        <div className="mt-16">
          <ImagePlaceholder
            description="Screenshot composite ou split-screen montrant plusieurs fonctionnalités clés : création de plan IA, tableau de bord fatigue avec graphiques, alertes de surcharge. Montage visuel attrayant montrant la richesse de la plateforme."
            aspectRatio="16/9"
            className="max-w-5xl mx-auto"
            imageSrc={featuresImage}
          />
        </div>

        <div className="mx-auto mt-16 max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = icons[index];
              return (
                <FeatureCard
                  key={index}
                  title={feature.title}
                  description={feature.description}
                  icon={<Icon className="h-6 w-6 text-primary" />}
                />
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}

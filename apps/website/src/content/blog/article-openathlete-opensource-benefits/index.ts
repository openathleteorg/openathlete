import type { BlogPost } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleOpenathleteOpensourceBenefits: BlogPost = {
  metadata: {
    slug: 'why-openathlete-open-source-privacy-innovation-2025',
    title: {
      en: 'Open-source training software: who owns your training data?',
      fr: "Logiciel d'entraînement libre : à qui appartiennent vos données ?",
      es: 'Software de entrenamiento libre: ¿de quién son tus datos?',
      it: 'Software di allenamento open source: di chi sono i tuoi dati?',
      'pt-br': 'Software de treino de código aberto: de quem são seus dados?',
      de: 'Open-Source-Trainingssoftware: Wem gehören deine Trainingsdaten?',
    },
    description: {
      en: "Today's Plan closed, Garmin bought TrainingPeaks. What data export really gives you, why OpenAthlete uses the AGPL, and what self-hosting costs.",
      fr: "Today's Plan a fermé, Garmin a racheté TrainingPeaks. Ce que vaut un export de données, pourquoi l'AGPL, et ce que coûte l'auto-hébergement.",
      es: "Today's Plan cerró y Garmin compró TrainingPeaks. Qué da de verdad una exportación, por qué la AGPL y qué cuesta el autoalojamiento.",
      it: "Today's Plan ha chiuso, Garmin ha comprato TrainingPeaks. Cosa vale un export dei dati, perché l'AGPL e quanto costa il self-hosting.",
      'pt-br':
        "O Today's Plan fechou e a Garmin comprou o TrainingPeaks. O que uma exportação entrega, por que a AGPL e quanto custa a auto-hospedagem.",
      de: 'Today’s Plan ist eingestellt, Garmin hat TrainingPeaks gekauft. Was ein Datenexport wirklich bringt, warum OpenAthlete die AGPL nutzt und was Selbst-Hosting kostet.',
    },
    excerpt: {
      en: 'Your training history is only as durable as the platform holding it. What open source, the AGPL and self-hosting change, and what they do not.',
      fr: "Votre historique d'entraînement n'est pas plus durable que la plateforme qui le conserve. Ce que l'open source, l'AGPL et l'auto-hébergement changent, et ce qu'ils ne changent pas.",
      es: 'Tu historial de entrenamiento dura lo mismo que la plataforma que lo guarda. Qué cambian el código abierto, la AGPL y el autoalojamiento, y qué no.',
      it: 'Il tuo storico di allenamento dura quanto la piattaforma che lo custodisce. Cosa cambiano open source, AGPL e self-hosting, e cosa no.',
      'pt-br':
        'O seu histórico de treino dura o mesmo que a plataforma que o guarda. O que o código aberto, a AGPL e a auto-hospedagem mudam, e o que não mudam.',
      de: 'Deine Trainingshistorie ist nur so beständig wie die Plattform, auf der sie liegt. Was Open Source, die AGPL und Selbst-Hosting ändern und was nicht.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-01-21',
    updatedAt: '2026-11-03',
    tags: ['Open source', 'Data ownership', 'Self-hosting', 'Privacy'],
    readingTime: 4,
    image:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxvcGVuJTIwc291cmNlJTIwc29mdHdhcmUlMjBjb2RlJTIwc2VjdXJpdHklMjBwcml2YWN5JTIwdHJhbnNwYXJlbmN5JTIwdGVjaG5vbG9neXxlbnwwfDB8fHwxNzY1Mjg3MzgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
  ContentDe,
};

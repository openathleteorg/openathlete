import type { BlogPost } from '../types';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleHybridCoaching: BlogPost = {
  metadata: {
    slug: 'hybrid-coaching-scaling-your-business-with-ai',
    title: {
      en: 'Hybrid coaching: how to coach more athletes with AI',
      fr: "Coaching hybride : suivre plus d'athlètes avec l'IA",
      es: 'Entrenamiento híbrido: llevar más atletas con ayuda de la IA',
      it: "Coaching ibrido: seguire più atleti con l'aiuto dell'IA",
      'pt-br': 'Coaching híbrido: atender mais alunos com ajuda da IA',
    },
    description: {
      en: 'What an endurance coach can hand to software and AI, what stays human, how to price your time, and a weekly routine that holds as the roster grows.',
      fr: "Ce qu'un coach d'endurance peut confier au logiciel et à l'IA, ce qui reste humain, comment fixer ses tarifs et organiser sa semaine.",
      es: 'Qué puede delegar un entrenador de resistencia en el software y la IA, qué sigue siendo humano, cómo fijar precios y organizar la semana.',
      it: "Cosa può delegare un allenatore di endurance al software e all'IA, cosa resta umano, come fissare i prezzi e organizzare la settimana.",
      'pt-br':
        'O que um treinador de endurance pode delegar ao software e à IA, o que continua humano, como precificar e organizar a semana.',
    },
    excerpt: {
      en: 'Measure where your coaching hours go, hand the clerical part to software and AI drafts, and keep your time for judgment. Plus a way to price it.',
      fr: "Mesurer où passent vos heures de coaching, confier la partie administrative au logiciel et aux brouillons d'IA, garder votre temps pour le jugement. Et une façon de le tarifer.",
      es: 'Mide en qué se van tus horas de entrenador, deja la parte de oficina al software y a los borradores de la IA, y guarda tu tiempo para el criterio. Y cómo ponerle precio.',
      it: "Misura dove finiscono le tue ore di coaching, lascia la parte d'ufficio al software e alle bozze dell'IA, e tieni il tuo tempo per il giudizio. E come prezzarlo.",
      'pt-br':
        'Meça para onde vão suas horas de treinador, deixe a parte burocrática com o software e os rascunhos da IA, e guarde seu tempo para o julgamento. E como precificar.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-02-25',
    updatedAt: '2026-11-03',
    tags: ['Coaching business', 'AI', 'Pricing', 'Workflow'],
    readingTime: 5,
    image:
      'https://images.unsplash.com/photo-1728637690589-95077d281c80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxjb2FjaCUyMG11bHRpcGxlJTIwYXRobGV0ZXMlMjB0ZWFtJTIwc2NhbGluZyUyMGJ1c2luZXNzJTIwZ3Jvd3RofGVufDB8MHx8fDE3NjUyODczNzl8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
};

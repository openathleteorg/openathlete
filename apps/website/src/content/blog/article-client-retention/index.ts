import type { BlogPost } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleClientRetention: BlogPost = {
  metadata: {
    slug: 'client-retention-why-athletes-quit-and-how-to-keep-them',
    title: {
      en: 'Why coached athletes quit, and how to keep them',
      fr: 'Pourquoi les athlètes quittent leur coach, et comment les garder',
      es: 'Por qué los atletas dejan a su entrenador y cómo retenerlos',
      it: "Perché gli atleti lasciano l'allenatore, e come trattenerli",
      'pt-br': 'Por que os alunos deixam a assessoria, e como mantê-los',
      de: 'Warum betreute Athleten aufhören und wie du sie hältst',
    },
    description: {
      en: 'Athletes rarely quit after one bad week; they drift. Onboarding, visible progress, a routine for athletes who go quiet, and a pause option.',
      fr: 'Un athlète part rarement après une mauvaise semaine : il décroche. Accueil, progression visible, que faire quand il ne donne plus de nouvelles.',
      es: 'Un atleta rara vez se va tras una mala semana: se desengancha. Primeras semanas, progreso visible y qué hacer cuando deja de dar señales.',
      it: 'Un atleta raramente se ne va dopo una settimana storta: si allontana. Prime settimane, progressi visibili e cosa fare quando sparisce.',
      'pt-br':
        'O aluno raramente sai depois de uma semana ruim: ele vai se desligando. Primeiras semanas, evolução visível e o que fazer quando ele some.',
      de: 'Athleten hören selten nach einer schlechten Woche auf, sie driften weg. Einstieg, sichtbarer Fortschritt, eine Routine für stille Athleten und eine Pause.',
    },
    excerpt: {
      en: 'What motivation research says about keeping athletes, and a practical routine for the first six weeks and for the athlete who stops replying.',
      fr: "Ce que dit la recherche sur la motivation, et une routine concrète pour les six premières semaines et pour l'athlète qui ne répond plus.",
      es: 'Lo que dice la investigación sobre motivación, y una rutina práctica para las primeras seis semanas y para el atleta que deja de responder.',
      it: "Cosa dice la ricerca sulla motivazione, e una routine pratica per le prime sei settimane e per l'atleta che smette di rispondere.",
      'pt-br':
        'O que a pesquisa sobre motivação diz, e uma rotina prática para as primeiras seis semanas e para o aluno que para de responder.',
      de: 'Was die Motivationsforschung über Kundenbindung sagt, und eine praktische Routine für die ersten sechs Wochen und für Athleten, die nicht mehr antworten.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-03-05',
    updatedAt: '2026-11-03',
    tags: ['Coaching business', 'Athlete retention', 'Motivation'],
    readingTime: 4,
    image:
      'https://images.unsplash.com/photo-1666537072206-6a7a01ecb7d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxhdGhsZXRlJTIwcHJvZ3Jlc3MlMjBjaGFydCUyMGdyYXBoJTIwaW1wcm92ZW1lbnQlMjBzdWNjZXNzJTIwcmV0ZW50aW9ufGVufDB8MHx8fDE3NjUyODczODB8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
  ContentDe,
};

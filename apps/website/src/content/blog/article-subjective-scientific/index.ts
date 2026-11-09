import type { BlogPost } from '../types';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleSubjectiveScientific: BlogPost = {
  metadata: {
    slug: 'subjective-but-scientific-quantifying-mental-fatigue',
    title: {
      en: 'Subjective but Scientific: How RPE Measures Fatigue',
      fr: 'Subjectif mais scientifique : mesurer la fatigue avec le RPE',
      es: 'Subjetivo pero científico: cómo el RPE mide la fatiga',
      it: "Soggettivo ma scientifico: come l'RPE misura la fatica",
      'pt-br': 'Subjetivo, mas científico: como a RPE mede a fadiga',
    },
    description: {
      en: "Borg's scales, Foster's session RPE and the evidence that self-reports track training load better than many lab markers. How to rate reliably.",
      fr: "Échelles de Borg, RPE de séance de Foster, et pourquoi l'auto-évaluation suit la charge mieux que bien des marqueurs. Comment bien noter.",
      es: 'Escalas de Borg, RPE de sesión de Foster y por qué la autoevaluación sigue la carga mejor que muchos marcadores. Cómo puntuar bien.',
      it: "Scale di Borg, session-RPE di Foster e perché l'autovalutazione segue il carico meglio di molti marcatori. Come valutare bene.",
      'pt-br':
        'Escalas de Borg, RPE da sessão de Foster e por que a autoavaliação acompanha a carga melhor que muitos marcadores. Como dar a nota.',
    },
    excerpt: {
      en: 'A number you make up yourself turns out to be one of the most sensitive fatigue measures there is, provided you rate it the same way every time.',
      fr: "Un chiffre que vous inventez vous-même se révèle l'une des mesures de fatigue les plus sensibles, à condition de toujours noter de la même façon.",
      es: 'Un número que te inventas tú resulta ser una de las medidas de fatiga más sensibles, siempre que puntúes siempre de la misma manera.',
      it: 'Un numero che ti inventi da solo si rivela una delle misure di fatica più sensibili, a patto di valutare sempre allo stesso modo.',
      'pt-br':
        'Um número que você mesmo inventa acaba sendo uma das medidas de fadiga mais sensíveis, desde que você dê a nota sempre do mesmo jeito.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-02-15',
    updatedAt: '2026-11-03',
    tags: ['RPE', 'Session RPE', 'Borg scale', 'Athlete monitoring'],
    readingTime: 4,
    image:
      'https://images.unsplash.com/photo-1758520144795-299f212ccba0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwyfHx3b3JrJTIwc3RyZXNzJTIwbWVudGFsJTIwZmF0aWd1ZSUyMGF0aGxldGUlMjB0aXJlZCUyMGJyYWluJTIwY29uY2VudHJhdGlvbnxlbnwwfDB8fHwxNzY1Mjg3Mzc5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
};

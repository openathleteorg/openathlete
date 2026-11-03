import type { BlogPost } from '../types';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleStopTrainingOnFeeling: BlogPost = {
  metadata: {
    slug: 'stop-training-on-feeling-the-wrong-kind',
    title: {
      en: 'Training by Feel: When It Helps and When It Holds You Back',
      fr: "S'entraîner aux sensations : quand ça aide, quand ça freine",
      es: 'Entrenar por sensaciones: cuándo ayuda y cuándo te frena',
      it: 'Allenarsi a sensazione: quando aiuta e quando ti frena',
      'pt-br': 'Treinar pela sensação: quando ajuda e quando atrapalha',
    },
    description: {
      en: 'Listening to your body is not the same as training on mood. How to tell signals from preferences, and simple rules for adjusting a plan.',
      fr: "Écouter son corps n'est pas s'entraîner à l'humeur. Distinguer signaux et envies, et des règles simples pour ajuster un plan.",
      es: 'Escuchar a tu cuerpo no es entrenar según el humor. Cómo distinguir señales de preferencias y reglas sencillas para ajustar un plan.',
      it: 'Ascoltare il corpo non è allenarsi a umore. Come distinguere segnali e preferenze, e regole semplici per adattare un programma.',
      'pt-br':
        'Escutar o corpo não é treinar conforme o humor. Como separar sinais de preferências e regras simples para ajustar a planilha.',
    },
    excerpt: {
      en: 'Speeding up on good days and skipping on flat ones turns every week into medium days. Decide your adjustment rules before the session, not during it.',
      fr: "Accélérer les bons jours et sauter les séances les jours sans transforme chaque semaine en jours moyens. Fixez vos règles d'ajustement avant la séance, pas pendant.",
      es: 'Acelerar los días buenos y saltarte sesiones los días flojos convierte cada semana en días intermedios. Decide tus reglas de ajuste antes de la sesión, no durante.',
      it: 'Accelerare nei giorni buoni e saltare in quelli fiacchi trasforma ogni settimana in giorni medi. Decidi le regole di adattamento prima della sessione, non durante.',
      'pt-br':
        'Acelerar nos dias bons e pular treino nos dias ruins transforma toda semana em dias médios. Defina suas regras de ajuste antes do treino, não durante.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-03-10',
    updatedAt: '2026-11-03',
    tags: [
      'Training plan',
      'Consistency',
      'Intensity distribution',
      'Autoregulation',
    ],
    readingTime: 4,
    image:
      'https://images.unsplash.com/photo-1435527173128-983b87201f4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxzdHJ1Y3R1cmVkJTIwdHJhaW5pbmclMjBjYWxlbmRhciUyMHNjaGVkdWxlJTIwcGxhbiUyMGRpc2NpcGxpbmV8ZW58MHwwfHx8MTc2NTI4NzM4MHww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
};

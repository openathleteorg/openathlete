import type { BlogPost } from '../types';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleCoachAthleteCommunication: BlogPost = {
  metadata: {
    slug: 'coach-athlete-communication-the-number-one-success-factor',
    title: {
      en: 'Coach-athlete communication: a weekly check-in that works',
      fr: 'Communication coach-athlète : un point hebdomadaire qui marche',
      es: 'Comunicación entrenador-atleta: un balance semanal que funciona',
      it: 'Comunicazione allenatore-atleta: un check-in settimanale efficace',
      'pt-br': 'Comunicação treinador-aluno: um check-in semanal que funciona',
    },
    description: {
      en: 'Where each kind of message belongs, a four-line weekly check-in, using session RPE as a conversation, and how to handle a bad race remotely.',
      fr: 'Où ranger chaque type de message, un point hebdomadaire en quatre lignes, le RPE comme base de discussion, et quoi dire après une course ratée.',
      es: 'Dónde va cada tipo de mensaje, un balance semanal en cuatro líneas, el RPE como conversación y cómo gestionar una mala carrera a distancia.',
      it: "Dove va ogni tipo di messaggio, un check-in settimanale in quattro righe, l'RPE come conversazione e come gestire una gara andata male.",
      'pt-br':
        'Onde fica cada tipo de mensagem, um check-in semanal em quatro linhas, o RPE como conversa e como lidar com uma prova ruim a distância.',
    },
    excerpt: {
      en: 'Coaches and athletes often disagree on how hard a session was. A simple structure for messages, check-ins and feedback closes the gap.',
      fr: "Coachs et athlètes ne s'accordent pas toujours sur la dureté d'une séance. Une structure simple pour les messages, les points et les retours réduit l'écart.",
      es: 'Entrenadores y atletas no siempre coinciden en lo dura que fue una sesión. Una estructura sencilla de mensajes, balances y feedback reduce la diferencia.',
      it: 'Allenatori e atleti spesso non concordano su quanto sia stata dura una seduta. Una struttura semplice per messaggi, check-in e feedback riduce il divario.',
      'pt-br':
        'Treinadores e alunos muitas vezes discordam sobre o quanto um treino foi duro. Uma estrutura simples de mensagens, check-ins e feedback reduz essa diferença.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-03-01',
    updatedAt: '2026-11-03',
    tags: ['Remote coaching', 'Communication', 'RPE', 'Feedback'],
    readingTime: 4,
    image:
      'https://images.unsplash.com/photo-1654002931929-70c5e3713bc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxjb2FjaCUyMGF0aGxldGUlMjB0YWxraW5nJTIwY29tbXVuaWNhdGlvbiUyMGZlZWRiYWNrJTIwZGlzY3Vzc2lvbnxlbnwwfDB8fHwxNzY1Mjg3Mzc5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
};

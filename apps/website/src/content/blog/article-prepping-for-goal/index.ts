import type { BlogPost } from '../types';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articlePreppingForGoal: BlogPost = {
  metadata: {
    slug: 'prepping-for-a-goal-adapting-when-life-happens',
    title: {
      en: 'Adapting Your Training Plan to Illness, Travel and Missed Weeks',
      fr: 'Adapter son plan : maladie, voyages, semaines perdues',
      es: 'Adaptar tu plan a enfermedades, viajes y semanas perdidas',
      it: 'Adattare il piano a malattie, viaggi e settimane perse',
      'pt-br': 'Como adaptar a planilha a doença, viagem e semanas perdidas',
    },
    description: {
      en: 'What to protect when a marathon plan goes wrong: missed sessions, illness, travel, lost weeks, the taper, and a worked example of flu in week 9.',
      fr: 'Que protéger quand une prépa marathon déraille : séances manquées, maladie, voyage, semaines perdues, affûtage, et l’exemple d’une grippe en semaine 9.',
      es: 'Qué proteger cuando un plan de maratón se tuerce: sesiones perdidas, enfermedad, viajes, semanas perdidas, la puesta a punto y un ejemplo real.',
      it: 'Cosa proteggere quando un piano maratona salta: sedute perse, malattia, viaggi, settimane perse, tapering e un esempio di influenza in settimana 9.',
      'pt-br':
        'O que proteger quando a planilha de maratona desanda: treinos perdidos, doença, viagem, semanas perdidas, o polimento e um exemplo com gripe.',
    },
    excerpt: {
      en: 'No 16-week plan survives 16 weeks untouched. Protect the key sessions, never stack missed ones, rejoin the plan where it is now, and leave the taper alone.',
      fr: 'Aucun plan de 16 semaines ne survit intact. Protégez les séances clés, n’empilez jamais les séances manquées, rejoignez le plan là où il en est, et ne touchez pas à l’affûtage.',
      es: 'Ningún plan de 16 semanas llega intacto al final. Protege las sesiones clave, no acumules las perdidas, vuelve al plan donde está ahora y no toques la puesta a punto.',
      it: 'Nessun piano di 16 settimane arriva intatto alla fine. Proteggi le sedute chiave, non accumulare quelle perse, rientra nel piano dove si trova ora e lascia stare il tapering.',
      'pt-br':
        'Nenhuma planilha de 16 semanas chega intacta ao fim. Proteja os treinos-chave, não acumule os perdidos, volte à planilha onde ela está agora e não mexa no polimento.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-03-25',
    updatedAt: '2026-11-03',
    tags: ['Training plan', 'Illness', 'Travel', 'Marathon'],
    readingTime: 5,
    image:
      'https://images.unsplash.com/photo-1645822937278-5e84025713f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxtYXJhdGhvbiUyMGZpbmlzaCUyMGxpbmUlMjBnb2FsJTIwYWNoaWV2ZW1lbnQlMjB0YXJnZXQlMjByYWNlfGVufDB8MHx8fDE3NjUyODczODF8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
};

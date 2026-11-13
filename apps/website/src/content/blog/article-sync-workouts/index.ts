import type { BlogPost } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleSyncWorkouts: BlogPost = {
  metadata: {
    // The slug predates the rewrite and stays for the indexed URL
    slug: 'how-to-sync-workouts-to-garmin-polar-polar',
    title: {
      en: 'How to send structured workouts to Garmin, COROS and Suunto',
      fr: 'Envoyer ses séances structurées sur Garmin, COROS et Suunto',
      es: 'Cómo enviar entrenamientos a tu Garmin, COROS o Suunto',
      it: 'Come inviare allenamenti strutturati a Garmin, COROS e Suunto',
      'pt-br': 'Como mandar treinos estruturados para Garmin, COROS e Suunto',
      de: 'Strukturierte Workouts an Garmin, COROS und Suunto senden',
    },
    description: {
      en: 'What reaches each watch, where to find it, why Polar and Strava get no workouts, and a checklist for when a workout is not on your watch.',
      fr: 'Ce qui arrive sur chaque montre, où le trouver, pourquoi Polar et Strava ne reçoivent rien, et que vérifier quand une séance manque.',
      es: 'Qué llega a cada reloj, dónde encontrarlo, por qué Polar y Strava no reciben entrenamientos y qué revisar cuando uno no aparece.',
      it: 'Cosa arriva su ogni orologio, dove trovarlo, perché Polar e Strava non ricevono allenamenti e cosa controllare se uno manca.',
      'pt-br':
        'O que chega a cada relógio, onde encontrar, por que Polar e Strava não recebem treinos e o que conferir quando um treino não aparece.',
      de: 'Was auf jeder Uhr ankommt, wo du es findest, warum Polar und Strava keine Workouts erhalten, und eine Checkliste, wenn ein Workout nicht auf deiner Uhr ist.',
    },
    excerpt: {
      en: 'Garmin, COROS and Suunto accept workouts from other apps; Polar and Strava do not. How each one shows the session, and what to check when it is missing.',
      fr: 'Garmin, COROS et Suunto acceptent des séances venues d’autres applications\u00a0; Polar et Strava non. Comment chacune affiche la séance, et que vérifier quand elle manque.',
      es: 'Garmin, COROS y Suunto aceptan entrenamientos de otras apps; Polar y Strava no. Cómo muestra cada uno la sesión y qué revisar cuando falta.',
      it: 'Garmin, COROS e Suunto accettano allenamenti da altre app; Polar e Strava no. Come ognuno mostra la seduta e cosa controllare quando manca.',
      'pt-br':
        'Garmin, COROS e Suunto aceitam treinos de outros apps; Polar e Strava não. Como cada um mostra o treino e o que conferir quando ele não aparece.',
      de: 'Garmin, COROS und Suunto nehmen Workouts aus anderen Apps an, Polar und Strava nicht. Wie jede Marke die Einheit anzeigt und was du prüfst, wenn sie fehlt.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-04-15',
    updatedAt: '2026-11-03',
    tags: ['Garmin', 'COROS', 'Suunto', 'Watch sync', 'How-to'],
    readingTime: 5,
    image:
      'https://images.unsplash.com/photo-1635863898961-e91351fc1741?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxzbWFydHdhdGNoJTIwc3luYyUyMHdvcmtvdXQlMjB0cmFuc2ZlciUyMGRldmljZSUyMHRlY2hub2xvZ3l8ZW58MHwwfHx8MTc2NTI4NzM4MHww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
  ContentDe,
};

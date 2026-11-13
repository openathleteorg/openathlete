import type { BlogPost } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleDigitalizingClubs: BlogPost = {
  metadata: {
    slug: 'digitalizing-your-sports-club-centralize-to-conquer',
    title: {
      en: 'How to organise training in a running or triathlon club',
      fr: "Organiser l'entraînement d'un club de course ou de triathlon",
      es: 'Cómo organizar el entrenamiento en un club de running o triatlón',
      it: "Organizzare l'allenamento in una società di corsa o triathlon",
      'pt-br': 'Como organizar os treinos de um clube de corrida ou triatlo',
      de: 'Das Training in einem Lauf- oder Triathlonverein organisieren',
    },
    description: {
      en: 'Groups by pace, one coach per group, sessions written once, health data handled with care, and the two ways a club can use OpenAthlete today.',
      fr: "Groupes par allure, un entraîneur par groupe, des séances écrites une fois, les données de santé, et deux façons d'utiliser OpenAthlete en club.",
      es: 'Grupos por ritmo, un entrenador por grupo, sesiones escritas una vez, datos de salud con cuidado y dos formas de usar OpenAthlete en un club.',
      it: 'Gruppi per ritmo, un allenatore per gruppo, sedute scritte una volta, dati sanitari con cura e due modi di usare OpenAthlete in società.',
      'pt-br':
        'Grupos por pace, um treinador por grupo, treinos escritos uma vez, cuidado com dados de saúde e duas formas de usar o OpenAthlete no clube.',
      de: 'Gruppen nach Pace, ein Trainer pro Gruppe, Einheiten einmal geschrieben, Sorgfalt bei Gesundheitsdaten und zwei Wege, OpenAthlete im Verein zu nutzen.',
    },
    excerpt: {
      en: 'A practical structure for clubs with several volunteer coaches, and an honest note: OpenAthlete has no club account, but there are two ways to make it work.',
      fr: "Une organisation concrète pour les clubs à plusieurs entraîneurs bénévoles, et une précision honnête : OpenAthlete n'a pas de compte club, mais deux façons de s'en servir.",
      es: 'Una estructura práctica para clubes con varios entrenadores voluntarios, y una aclaración honesta: OpenAthlete no tiene cuenta de club, pero hay dos formas de usarlo.',
      it: 'Una struttura pratica per società con più allenatori volontari, e una precisazione onesta: OpenAthlete non ha un account per società, ma ci sono due modi per usarlo.',
      'pt-br':
        'Uma estrutura prática para clubes com vários treinadores, e um aviso honesto: o OpenAthlete não tem conta de clube, mas há duas formas de usá-lo.',
      de: 'Eine praktische Struktur für Vereine mit mehreren Trainern und ein ehrlicher Hinweis: OpenAthlete hat kein Vereinskonto, aber es gibt zwei Wege, es zu nutzen.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-04-01',
    updatedAt: '2026-11-03',
    tags: ['Clubs', 'Group training', 'Self-hosting'],
    readingTime: 4,
    image:
      'https://images.unsplash.com/photo-1625990637351-ee0e5e9ba5e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjbHViJTIwdGVhbSUyMHRyYWluaW5nJTIwZ3JvdXAlMjBtYW5hZ2VtZW50JTIwb3JnYW5pemF0aW9ufGVufDB8MHx8fDE3NjUyODczNzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
  ContentDe,
};

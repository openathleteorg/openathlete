import type { BlogPost } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentNl } from './nl';
import { ContentPl } from './pl';
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
      pl: 'Jak zorganizować trening w klubie biegowym lub triathlonowym',
      nl: 'Training organiseren in een hardloop- of triatlonclub',
    },
    description: {
      en: 'Groups by pace, one coach per group, sessions written once, health data handled with care, and the two ways a club can use OpenAthlete today.',
      fr: "Groupes par allure, un entraîneur par groupe, des séances écrites une fois, les données de santé, et deux façons d'utiliser OpenAthlete en club.",
      es: 'Grupos por ritmo, un entrenador por grupo, sesiones escritas una vez, datos de salud con cuidado y dos formas de usar OpenAthlete en un club.',
      it: 'Gruppi per ritmo, un allenatore per gruppo, sedute scritte una volta, dati sanitari con cura e due modi di usare OpenAthlete in società.',
      'pt-br':
        'Grupos por pace, um treinador por grupo, treinos escritos uma vez, cuidado com dados de saúde e duas formas de usar o OpenAthlete no clube.',
      de: 'Gruppen nach Pace, ein Trainer pro Gruppe, Einheiten einmal geschrieben, Sorgfalt bei Gesundheitsdaten und zwei Wege, OpenAthlete im Verein zu nutzen.',
      pl: 'Grupy według tempa, jeden trener na grupę, treningi pisane raz, ostrożność z danymi o zdrowiu i dwa sposoby, w jakie klub może dziś korzystać z OpenAthlete.',
      nl: 'Groepen op tempo, één trainer per groep, trainingen één keer geschreven, zorgvuldig met gezondheidsgegevens, en twee manieren waarop een club OpenAthlete nu kan gebruiken.',
    },
    excerpt: {
      en: 'A practical structure for clubs with several volunteer coaches, and how the free OpenAthlete club space handles groups, a shared library and weekly club sessions.',
      fr: "Une organisation concrète pour les clubs à plusieurs entraîneurs bénévoles, et ce que l'espace club gratuit d'OpenAthlete apporte : groupes, bibliothèque partagée et séances de club.",
      es: 'Una estructura práctica para clubes con varios entrenadores voluntarios, y lo que aporta el espacio de club gratuito de OpenAthlete: grupos, biblioteca compartida y sesiones de club.',
      it: 'Una struttura pratica per società con più allenatori volontari, e cosa offre lo spazio gratuito di OpenAthlete per le società: gruppi, libreria condivisa e sedute di società.',
      'pt-br':
        'Uma estrutura prática para clubes com vários treinadores, e o que o espaço de clube gratuito do OpenAthlete oferece: grupos, biblioteca compartilhada e treinos do clube.',
      de: 'Eine praktische Struktur für Vereine mit mehreren Trainern und was der kostenlose Vereinsbereich von OpenAthlete bietet: Gruppen, gemeinsame Bibliothek und Vereinseinheiten.',
      pl: 'Praktyczna struktura dla klubów z kilkoma trenerami wolontariuszami i to, jak bezpłatna przestrzeń klubowa OpenAthlete obsługuje grupy, wspólną bibliotekę i cotygodniowe treningi klubowe.',
      nl: 'Een praktische structuur voor clubs met meerdere vrijwillige trainers, en hoe de gratis clubruimte van OpenAthlete groepen, een gedeelde bibliotheek en wekelijkse clubtrainingen regelt.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-04-01',
    updatedAt: '2026-11-13',
    tags: ['Clubs', 'Group training', 'Self-hosting'],
    readingTime: 5,
    image:
      'https://images.unsplash.com/photo-1625990637351-ee0e5e9ba5e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBjbHViJTIwdGVhbSUyMHRyYWluaW5nJTIwZ3JvdXAlMjBtYW5hZ2VtZW50JTIwb3JnYW5pemF0aW9ufGVufDB8MHx8fDE3NjUyODczNzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
  ContentDe,
  ContentPl,
  ContentNl,
};

import type { BlogPost } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleProgressiveOverload: BlogPost = {
  metadata: {
    slug: 'progressive-overload-increasing-intensity-without-breaking',
    title: {
      en: 'Progressive Overload for Runners: Build Without Breaking',
      fr: 'Surcharge progressive en course à pied : progresser sans casser',
      es: 'Sobrecarga progresiva en carrera: progresar sin romperte',
      it: 'Sovraccarico progressivo nella corsa: progredire senza rompersi',
      'pt-br': 'Sobrecarga progressiva na corrida: evoluir sem se quebrar',
      de: 'Progressive Überlastung beim Laufen: steigern, ohne kaputtzugehen',
    },
    description: {
      en: 'How to progress running sessions one lever at a time: a six-week threshold example, long run steps, easy days, lighter weeks and when to stop.',
      fr: 'Faire progresser vos séances un levier à la fois : un exemple au seuil sur six semaines, la sortie longue, les footings, les semaines allégées.',
      es: 'Cómo hacer progresar tus sesiones palanca a palanca: un ejemplo de umbral en seis semanas, la tirada larga, los días suaves y las descargas.',
      it: 'Come far progredire le sedute una leva alla volta: un esempio a soglia in sei settimane, il lungo, i giorni facili e le settimane di scarico.',
      'pt-br':
        'Como fazer seus treinos progredirem uma alavanca por vez: um exemplo de limiar em seis semanas, o longão, os dias leves e as regenerativas.',
      de: 'Laufeinheiten Hebel für Hebel steigern: ein Schwellenbeispiel über sechs Wochen, der lange Lauf, lockere Tage, Entlastungswochen und wann du aufhörst.',
    },
    excerpt: {
      en: 'Adding kilometres is only one way to overload. Progress the sessions themselves, one lever at a time, keep the easy days easy, and know when holding a level is enough.',
      fr: 'Ajouter des kilomètres n’est qu’une façon de surcharger. Faites progresser les séances elles-mêmes, un levier à la fois, gardez des footings faciles, et sachez quand maintenir un niveau suffit.',
      es: 'Sumar kilómetros es solo una forma de sobrecargar. Haz progresar las propias sesiones, palanca a palanca, mantén suaves los días suaves y aprende cuándo basta con mantener un nivel.',
      it: 'Aggiungere chilometri è solo un modo di sovraccaricare. Fai progredire le sedute stesse, una leva alla volta, tieni facili i giorni facili e sappi quando basta mantenere un livello.',
      'pt-br':
        'Somar quilômetros é só um jeito de sobrecarregar. Faça os próprios treinos progredirem, uma alavanca por vez, mantenha leves os dias leves e saiba quando basta segurar um nível.',
      de: 'Mehr Kilometer sind nur eine Form der Überlastung. Steigere die Einheiten selbst, einen Hebel nach dem anderen, halte lockere Tage locker und erkenne, wann es reicht, ein Niveau zu halten.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-03-20',
    updatedAt: '2026-11-03',
    tags: ['Progressive overload', 'Periodization', 'Threshold', 'Long run'],
    readingTime: 4,
    image:
      'https://images.unsplash.com/photo-1638536534847-2cb61af9efe3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxwcm9ncmVzc2l2ZSUyMHRyYWluaW5nJTIwd2VpZ2h0cyUyMGR1bWJiZWxscyUyMGdyYWR1YWwlMjBpbmNyZWFzZXxlbnwwfDB8fHwxNzY1Mjg3MzgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
  ContentDe,
};

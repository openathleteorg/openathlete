import type { BlogPost } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleGenerativeAiSports: BlogPost = {
  metadata: {
    slug: 'generative-ai-in-sports-gadget-or-revolution',
    title: {
      en: "Generative AI for runners: what it's good for, and what not",
      fr: "IA générative et course à pied : ce qu'elle fait bien ou mal",
      es: 'IA generativa para corredores: para qué sirve y para qué no',
      it: 'IA generativa per runner: a cosa serve e a cosa no',
      'pt-br': 'IA generativa para corredores: para que serve e para que não',
      de: 'Generative KI für Läufer: wofür sie taugt und wofür nicht',
    },
    description: {
      en: 'ChatGPT and co. write sessions, summarise notes and log how a run felt. They are poor at diagnosing pain or building a plan from nothing.',
      fr: 'ChatGPT et consorts écrivent des séances, résument vos notes et relèvent votre ressenti. Ils sont mauvais pour diagnostiquer ou bâtir un plan.',
      es: 'ChatGPT y compañía escriben sesiones, resumen notas y registran sensaciones. Fallan al diagnosticar dolores o crear un plan desde cero.',
      it: 'ChatGPT e simili scrivono sedute, riassumono note e registrano le sensazioni. Sbagliano nel diagnosticare dolori o creare un piano da zero.',
      'pt-br':
        'ChatGPT e afins escrevem treinos, resumem anotações e registram a percepção. Erram ao diagnosticar dores ou montar uma planilha do zero.',
      de: 'ChatGPT & Co. schreiben Einheiten, fassen Notizen zusammen und erfassen dein Gefühl. Schmerzen diagnostizieren oder Pläne erstellen können sie schlecht.',
    },
    excerpt: {
      en: 'Generative AI is a text tool: good at turning a sentence into a structured session, bad at being right about your body. A practical, sceptical guide.',
      fr: "L'IA générative est un outil de texte : douée pour transformer une phrase en séance structurée, peu fiable dès qu'il s'agit de votre corps. Un guide pratique et sceptique.",
      es: 'La IA generativa es una herramienta de texto: buena para convertir una frase en una sesión estructurada, mala para acertar sobre tu cuerpo. Una guía práctica y escéptica.',
      it: "L'IA generativa è uno strumento per il testo: brava a trasformare una frase in una seduta strutturata, inaffidabile sul tuo corpo. Una guida pratica e scettica.",
      'pt-br':
        'A IA generativa é uma ferramenta de texto: boa para transformar uma frase num treino estruturado, ruim para acertar sobre o seu corpo. Um guia prático e cético.',
      de: 'Generative KI ist ein Textwerkzeug: gut darin, aus einem Satz eine strukturierte Einheit zu machen, schlecht darin, über deinen Körper recht zu haben. Ein praktischer, skeptischer Leitfaden.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-02-05',
    updatedAt: '2026-11-03',
    tags: ['AI', 'ChatGPT', 'Running', 'Workouts'],
    readingTime: 4,
    image:
      'https://images.unsplash.com/photo-1435527173128-983b87201f4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHx0cmFpbmluZyUyMHBsYW4lMjBjYWxlbmRhciUyMGFkYXB0JTIwc2NoZWR1bGUlMjBjaGFuZ2UlMjBkeW5hbWljfGVufDB8MHx8fDE3NjUyODczNzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
  ContentDe,
};

import type { BlogPost } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentNl } from './nl';
import { ContentPl } from './pl';
import { ContentPtBr } from './pt-br';

export const article1: BlogPost = {
  metadata: {
    slug: 'introducing-openathlete',
    title: {
      en: 'What OpenAthlete is, and why it exists',
      fr: "OpenAthlete : ce que c'est et pourquoi le projet existe",
      es: 'Qué es OpenAthlete y por qué existe',
      it: "Cos'è OpenAthlete e perché esiste",
      'pt-br': 'O que é o OpenAthlete e por que ele existe',
      de: 'Was OpenAthlete ist und warum es das Projekt gibt',
      pl: 'Czym jest OpenAthlete i dlaczego powstał',
      nl: 'Wat OpenAthlete is en waarom het bestaat',
    },
    description: {
      en: 'An open-source training platform for endurance athletes and coaches: what it does today, what it does not do, and how it is paid for.',
      fr: "Une plateforme d'entraînement libre pour sportifs d'endurance et coachs : ce qu'elle fait, ce qu'elle ne fait pas et comment elle est financée.",
      es: 'Una plataforma de entrenamiento de código abierto para deportistas de resistencia y entrenadores: qué hace, qué no hace y cómo se financia.',
      it: 'Una piattaforma di allenamento open source per atleti di endurance e allenatori: cosa fa oggi, cosa non fa e come si finanzia.',
      'pt-br':
        'Uma plataforma de treino de código aberto para atletas de endurance e treinadores: o que ela faz, o que não faz e como se paga.',
      de: 'Eine Open-Source-Trainingsplattform für Ausdauersportler und Coaches: was sie heute kann, was sie nicht kann und wie sie finanziert wird.',
      pl: 'Otwartoźródłowa platforma treningowa dla sportowców wytrzymałościowych i trenerów: co potrafi dziś, czego nie potrafi i jak jest finansowana.',
      nl: 'Een opensourcetrainingsplatform voor duursporters en coaches: wat het vandaag kan, wat het niet kan en hoe het betaald wordt.',
    },
    excerpt: {
      en: 'OpenAthlete plans your training, talks to your watch and tracks load, for athletes and coaches. Here is why it was built and where its limits are.',
      fr: 'OpenAthlete planifie votre entraînement, dialogue avec votre montre et suit la charge, pour les athlètes comme pour les coachs. Voici pourquoi il a été créé et où sont ses limites.',
      es: 'OpenAthlete planifica tu entrenamiento, se conecta con tu reloj y sigue la carga, para atletas y entrenadores. Aquí explicamos por qué se creó y dónde están sus límites.',
      it: "OpenAthlete pianifica l'allenamento, parla con il tuo orologio e segue il carico, per atleti e allenatori. Ecco perché è nato e dove sono i suoi limiti.",
      'pt-br':
        'O OpenAthlete planeja o seu treino, conversa com o seu relógio e acompanha a carga, para atletas e treinadores. Veja por que ele foi criado e onde estão os limites.',
      de: 'OpenAthlete plant dein Training, spricht mit deiner Uhr und verfolgt die Belastung, für Athleten und Coaches. Hier erfährst du, warum es entstanden ist und wo seine Grenzen liegen.',
      pl: 'OpenAthlete planuje Twój trening, rozmawia z Twoim zegarkiem i śledzi obciążenie, dla zawodników i trenerów. Oto dlaczego powstał i gdzie są jego granice.',
      nl: 'OpenAthlete plant je training, praat met je horloge en houdt de belasting bij, voor atleten en coaches. Hier lees je waarom het gebouwd is en waar de grenzen liggen.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-01-15',
    updatedAt: '2026-11-13',
    tags: ['OpenAthlete', 'Open source', 'Coaching', 'Training planning'],
    readingTime: 4,
    image:
      'https://images.unsplash.com/photo-1614155128617-b563db770a55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxlbmR1cmFuY2UlMjBhdGhsZXRlJTIwcnVubmluZyUyMHRyYWluaW5nJTIwQUklMjBjb2FjaGluZyUyMHBsYXRmb3JtJTIwdGVjaG5vbG9neXxlbnwwfDB8fHwxNzY1Mjg3NDU2fDA&ixlib=rb-4.1.0&q=80&w=1080',
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

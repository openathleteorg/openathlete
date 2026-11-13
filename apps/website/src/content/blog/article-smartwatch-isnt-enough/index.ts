import type { BlogPost } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleSmartwatchIsntEnough: BlogPost = {
  metadata: {
    slug: 'why-your-smartwatch-isnt-enough',
    title: {
      en: "Why Your Smartwatch Isn't Enough to Guide Your Training",
      fr: 'Pourquoi votre montre ne suffit pas à guider votre entraînement',
      es: 'Por qué tu reloj deportivo no basta para guiar tu entrenamiento',
      it: "Perché l'orologio non basta per guidare il tuo allenamento",
      'pt-br': 'Por que o seu relógio não basta para guiar o seu treino',
      de: 'Warum deine Sportuhr nicht reicht, um dein Training zu steuern',
    },
    description: {
      en: "What a running watch measures well, what it only estimates, and the context it can't see: the plan, how a session felt, and your life.",
      fr: "Ce que votre montre mesure bien, ce qu'elle ne fait qu'estimer, et le contexte qu'elle ignore : le plan, le ressenti et votre vie.",
      es: 'Lo que tu reloj mide bien, lo que solo estima y el contexto que no ve: el plan, cómo te sentiste y tu vida.',
      it: "Cosa misura bene l'orologio, cosa si limita a stimare e il contesto che non vede: il programma, le sensazioni e la tua vita.",
      'pt-br':
        'O que o relógio mede bem, o que ele só estima e o contexto que ele não vê: a planilha, como você se sentiu e a sua vida.',
      de: 'Was eine Laufuhr gut misst, was sie nur schätzt und welchen Kontext sie nicht sieht: den Plan, wie sich eine Einheit angefühlt hat, und dein Leben.',
    },
    excerpt: {
      en: 'Heart rate and GPS are measurements; recovery time and readiness scores are estimates. Use your watch for what it does well and add the context it lacks.',
      fr: "Fréquence cardiaque et GPS sont des mesures ; temps de récupération et score de disponibilité sont des estimations. Servez-vous de la montre pour ce qu'elle fait bien, et ajoutez le contexte qui lui manque.",
      es: 'El pulso y el GPS son mediciones; el tiempo de recuperación y la disposición son estimaciones. Usa el reloj para lo que hace bien y añade el contexto que le falta.',
      it: "Frequenza cardiaca e GPS sono misure; tempo di recupero e prontezza sono stime. Usa l'orologio per ciò che fa bene e aggiungi il contesto che gli manca.",
      'pt-br':
        'Frequência cardíaca e GPS são medições; tempo de recuperação e prontidão são estimativas. Use o relógio para o que ele faz bem e acrescente o contexto que falta.',
      de: 'Herzfrequenz und GPS sind Messwerte, Erholungszeit und Bereitschaftswerte sind Schätzungen. Nutze deine Uhr für das, was sie gut kann, und ergänze den Kontext, der ihr fehlt.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-03-15',
    updatedAt: '2026-11-03',
    tags: ['Running watch', 'Wearables', 'Training data', 'RPE'],
    readingTime: 3,
    image:
      'https://images.unsplash.com/photo-1434494745656-1aea7daa8f6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxzbWFydHdhdGNoJTIwZml0bmVzcyUyMHRyYWNrZXIlMjBkYXRhJTIwYW5hbHlzaXMlMjBpbnRlcnByZXRhdGlvbnxlbnwwfDB8fHwxNzY1Mjg3MzgxfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
  ContentDe,
};

import type { BlogPost } from '../types';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleCognitiveLoad: BlogPost = {
  metadata: {
    slug: 'understanding-cognitive-load-in-endurance-sports',
    title: {
      en: 'Cognitive Load in Endurance Sports: What Mental Fatigue Does',
      fr: 'Charge cognitive en endurance : ce que fait la fatigue mentale',
      es: 'Carga cognitiva en deportes de resistencia y fatiga mental',
      it: 'Carico cognitivo negli sport di endurance e fatica mentale',
      'pt-br': 'Carga cognitiva nos esportes de endurance e fadiga mental',
    },
    description: {
      en: 'Mental fatigue raises perceived effort without changing heart rate. What the studies show, how strong the evidence is, and how to plan around it.',
      fr: "La fatigue mentale augmente l'effort perçu sans changer le cardio. Ce que montrent les études, leur solidité, et comment organiser vos séances.",
      es: 'La fatiga mental eleva el esfuerzo percibido sin cambiar el pulso. Qué muestran los estudios, cuán sólida es la evidencia y cómo planificar.',
      it: 'La fatica mentale alza lo sforzo percepito senza cambiare il cardio. Cosa dicono gli studi, quanto sono solidi e come organizzarti.',
      'pt-br':
        'A fadiga mental aumenta a percepção de esforço sem mudar o batimento. O que os estudos mostram, quão sólida é a evidência e como planejar.',
    },
    excerpt: {
      en: 'A draining day at work can make a threshold session feel harder without touching your heart rate. The research, its limits, and what to change in your week.',
      fr: "Une journée éprouvante peut rendre une séance au seuil plus dure sans toucher au cardio. La recherche, ses limites, et ce qu'il faut changer dans votre semaine.",
      es: 'Un día agotador en el trabajo puede hacer más dura una sesión de umbral sin tocar el pulso. La investigación, sus límites y qué cambiar en tu semana.',
      it: 'Una giornata pesante al lavoro può rendere più dura una sessione di soglia senza toccare il cardio. La ricerca, i suoi limiti e cosa cambiare nella tua settimana.',
      'pt-br':
        'Um dia exaustivo no trabalho pode deixar um treino de limiar mais difícil sem mexer na frequência cardíaca. A pesquisa, seus limites e o que mudar na sua semana.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-05-01',
    updatedAt: '2026-11-03',
    tags: ['Mental fatigue', 'Cognitive load', 'RPE', 'Endurance'],
    readingTime: 4,
    image:
      'https://images.unsplash.com/photo-1761637755331-562c6529ace6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxicmFpbiUyMG1pbmQlMjBtZW50YWwlMjBmb2N1cyUyMGNvbmNlbnRyYXRpb24lMjBjb2duaXRpdmUlMjBwZXJmb3JtYW5jZXxlbnwwfDB8fHwxNzY1Mjg3Mzc5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
};

import type { BlogPost } from '../types';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleOvertrainingSigns: BlogPost = {
  metadata: {
    slug: '5-signs-of-overtraining-and-how-to-avoid-it',
    title: {
      en: "5 Signs of Overtraining, and When It's Only Overreaching",
      fr: '5 signes de surentraînement, et quand ce n’est que du surmenage',
      es: '5 señales de sobreentrenamiento y cuándo es solo sobrecarga',
      it: '5 segnali di sovrallenamento, e quando è solo overreaching',
      'pt-br': '5 sinais de overtraining, e quando é só overreaching',
    },
    description: {
      en: 'Functional overreaching, non-functional overreaching or overtraining syndrome: the five signs to watch, what else causes them, and what to do.',
      fr: 'Surmenage fonctionnel, non fonctionnel ou syndrome de surentraînement : les cinq signes à surveiller, leurs autres causes possibles et quoi faire.',
      es: 'Sobrecarga funcional, no funcional o síndrome de sobreentrenamiento: las cinco señales a vigilar, qué más las causa y qué hacer en cada caso.',
      it: 'Overreaching funzionale, non funzionale o sindrome da sovrallenamento: i cinque segnali da osservare, le altre cause possibili e cosa fare.',
      'pt-br':
        'Overreaching funcional, não funcional ou síndrome de overtraining: os cinco sinais a observar, o que mais pode causá-los e o que fazer.',
    },
    excerpt: {
      en: 'Real overtraining syndrome is rare. Most tired runners are overreached, ill or under-fuelled. Here is how to tell the states apart and what each one calls for.',
      fr: 'Le vrai syndrome de surentraînement est rare. La plupart des coureurs fatigués sont en surmenage, malades ou mal alimentés. Voici comment distinguer ces états et ce que chacun demande.',
      es: 'El síndrome de sobreentrenamiento real es raro. La mayoría de los corredores cansados están en sobrecarga, enfermos o comen poco. Así se distinguen estos estados y esto pide cada uno.',
      it: 'La vera sindrome da sovrallenamento è rara. La maggior parte dei runner stanchi è in overreaching, malata o mangia troppo poco. Ecco come distinguere questi stati e cosa richiede ciascuno.',
      'pt-br':
        'A síndrome de overtraining de verdade é rara. A maioria dos corredores cansados está em overreaching, doente ou comendo pouco. Veja como separar esses estados e o que cada um pede.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-05-05',
    updatedAt: '2026-11-03',
    tags: ['Overtraining', 'Overreaching', 'Recovery', 'Fatigue'],
    readingTime: 5,
    image:
      'https://images.unsplash.com/photo-1615934679271-1810698dfdfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHxvdmVydHJhaW5pbmclMjBmYXRpZ3VlJTIwZXhoYXVzdGlvbiUyMHJlY292ZXJ5JTIwcmVzdCUyMGF0aGxldGUlMjB0aXJlZHxlbnwwfDB8fHwxNzY1Mjg3Mzc5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
};

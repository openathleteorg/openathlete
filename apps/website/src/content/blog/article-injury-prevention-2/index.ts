import type { BlogPost } from '../types';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleInjuryPrevention2: BlogPost = {
  metadata: {
    slug: 'injury-prevention-2-when-algorithms-predict-the-break',
    title: {
      en: 'How Fast to Increase Running Mileage, Week by Week',
      fr: 'À quel rythme augmenter son kilométrage, semaine après semaine',
      es: 'Cuánto aumentar tu kilometraje semana a semana',
      it: 'Quanto aumentare il chilometraggio settimana dopo settimana',
      'pt-br': 'Quanto aumentar a quilometragem semana a semana',
    },
    description: {
      en: 'Why the 10% rule fails, how to build running volume in steps with lighter weeks, and a 16-week example from 40 to 70 km per week.',
      fr: 'Pourquoi la règle des 10 % ne tient pas, comment monter le volume par paliers avec des semaines allégées, et un exemple de 40 à 70 km en 16 semaines.',
      es: 'Por qué falla la regla del 10 %, cómo subir el volumen por escalones con semanas de descarga y un ejemplo de 16 semanas de 40 a 70 km.',
      it: 'Perché la regola del 10% non funziona, come aumentare il volume a gradini con settimane di scarico e un esempio da 40 a 70 km in 16 settimane.',
      'pt-br':
        'Por que a regra dos 10% falha, como subir o volume em degraus com semanas regenerativas e um exemplo de 16 semanas, de 40 a 70 km.',
    },
    excerpt: {
      en: 'The 10% rule did not reduce injuries when it was tested, and it compounds into nonsense. Steps, plateaus and planned lighter weeks work better, with one change at a time.',
      fr: 'Testée, la règle des 10 % n’a pas réduit les blessures, et appliquée sans pause elle s’emballe. Des marches, des paliers et des semaines allégées planifiées fonctionnent mieux, avec une seule nouveauté à la fois.',
      es: 'Cuando se puso a prueba, la regla del 10 % no redujo las lesiones, y aplicada sin pausa se dispara. Funcionan mejor los escalones, las mesetas y las semanas de descarga planificadas, con una sola novedad cada vez.',
      it: 'Messa alla prova, la regola del 10% non ha ridotto gli infortuni, e applicata senza pause esplode. Funzionano meglio gradini, pianerottoli e settimane di scarico pianificate, con una novità alla volta.',
      'pt-br':
        'Quando foi testada, a regra dos 10% não reduziu lesões, e aplicada sem pausa ela dispara. Degraus, patamares e semanas regenerativas planejadas funcionam melhor, com uma novidade de cada vez.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-02-10',
    updatedAt: '2026-11-03',
    tags: ['Running volume', '10% rule', 'Recovery weeks', 'Training load'],
    readingTime: 5,
    image:
      'https://images.unsplash.com/photo-1495213882804-d108674f7b83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHx0cmFpbmluZyUyMGxvYWQlMjBncmFwaCUyMGNoYXJ0JTIwaW5jcmVhc2UlMjBzcGlrZSUyMGluanVyeSUyMHJpc2t8ZW58MHwwfHx8MTc2NTI4NzM3NXww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
};

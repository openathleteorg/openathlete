import type { BlogPost } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const articleTrimp: BlogPost = {
  metadata: {
    slug: 'what-is-trimp-and-how-to-use-it',
    title: {
      en: "TRIMP explained: Banister's formula with a worked example",
      fr: 'Le TRIMP expliqué\u00a0: formule de Banister et exemple chiffré',
      es: 'TRIMP: qué es, fórmula de Banister y cómo calcularlo',
      it: 'TRIMP: cos’è, formula di Banister ed esempio di calcolo',
      'pt-br': 'TRIMP: o que é, fórmula de Banister e como calcular',
      de: 'TRIMP: Was es ist, die Banister-Formel und wie du ihn berechnest',
    },
    description: {
      en: "Banister's TRIMP with the 0.64/1.92 and 0.86/1.67 coefficients, a worked example, and where heart-rate load misleads you.",
      fr: 'Le TRIMP de Banister avec ses coefficients 0,64/1,92 et 0,86/1,67, un exemple chiffré et les limites de la charge cardiaque.',
      es: 'El TRIMP de Banister con los coeficientes 0,64/1,92 y 0,86/1,67, un ejemplo de cálculo paso a paso y dónde falla la carga por pulso.',
      it: 'Il TRIMP di Banister con i coefficienti 0,64/1,92 e 0,86/1,67, un esempio di calcolo e i limiti del carico da frequenza cardiaca.',
      'pt-br':
        'O TRIMP de Banister com os coeficientes 0,64/1,92 e 0,86/1,67, um exemplo de cálculo e onde a carga por frequência cardíaca engana.',
      de: 'Banisters TRIMP mit den Koeffizienten 0,64/1,92 und 0,86/1,67, ein Rechenbeispiel und wo die herzfrequenzbasierte Belastung täuscht.',
    },
    excerpt: {
      en: 'How to compute Banister TRIMP by hand, why averaging heart rate underestimates interval sessions, and what heart rate cannot see.',
      fr: 'Calculer le TRIMP de Banister à la main, comprendre pourquoi la fréquence moyenne sous-estime le fractionné, et ce que le cardio ne voit pas.',
      es: 'Cómo calcular a mano el TRIMP de Banister, por qué la frecuencia media subestima las series y qué no ve el pulso.',
      it: 'Come calcolare a mano il TRIMP di Banister, perché la frequenza media sottostima le ripetute e cosa il cardio non vede.',
      'pt-br':
        'Como calcular o TRIMP de Banister à mão, por que a frequência média subestima os tiros e o que a frequência cardíaca não enxerga.',
      de: 'Wie du den Banister-TRIMP von Hand berechnest, warum die Durchschnitts-HF Intervalle unterschätzt und was die Herzfrequenz nicht sieht.',
    },
    author: {
      name: 'OpenAthlete Team',
      email: 'contact@openathlete.org',
    },
    publishedAt: '2025-04-20',
    updatedAt: '2026-11-03',
    tags: ['TRIMP', 'Training load', 'Heart rate', 'Sports science'],
    readingTime: 7,
    image:
      'https://images.unsplash.com/photo-1669399213378-2853e748f217?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDE1NDF8MHwxfHNlYXJjaHwxfHx0cmFpbmluZyUyMG1ldHJpY3MlMjBkYXRhJTIwYW5hbHlzaXMlMjBjaGFydHMlMjBncmFwaHMlMjBwZXJmb3JtYW5jZXxlbnwwfDB8fHwxNzY1Mjg3MzgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  ContentEn,
  ContentFr,
  ContentEs,
  ContentIt,
  ContentPtBr,
  ContentDe,
};

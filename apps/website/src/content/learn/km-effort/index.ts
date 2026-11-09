import type { LearnTerm } from '../types';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const kmEffort: LearnTerm = {
  slug: 'km-effort',
  theme: 'racing',
  name: {
    en: 'Km-effort',
    fr: 'Kilomètre-effort',
    es: 'Kilómetro-esfuerzo',
    it: 'Km-sforzo',
    'pt-br': 'Km-esforço',
  },
  title: {
    en: 'Km-effort: definition, formula, example',
    fr: 'Qu’est-ce que le km-effort ? Définition, formule, exemple',
    es: '¿Qué es el km-esfuerzo? Definición, fórmula y ejemplo',
    it: 'Cos’è il km-sforzo? Definizione, formula, esempio',
    'pt-br': 'O que é km-esforço? Definição, fórmula e exemplo',
  },
  description: {
    en: 'Km-effort adds climbing to distance: km + D+/100. How to calculate it, a trail race time prediction with Riegel’s formula, and where it misleads.',
    fr: 'Le km-effort ajoute le dénivelé à la distance : km + D+/100. Le calcul, une prédiction de temps en trail avec la formule de Riegel et ses limites.',
    es: 'El km-esfuerzo suma el desnivel a la distancia: km + D+/100. Cómo calcularlo, una predicción de tiempo en trail con Riegel y sus límites.',
    it: 'Il km-sforzo somma il dislivello alla distanza: km + D+/100. Come calcolarlo, una previsione del tempo nel trail con Riegel e i suoi limiti.',
    'pt-br':
      'O km-esforço soma a subida à distância: km + D+/100. Como calcular, uma previsão de tempo de trail com a fórmula de Riegel e os limites.',
  },
  definition: {
    en: 'Km-effort is a trail running measure of course difficulty that adds one kilometre for every 100 metres of ascent: km-effort = distance in km + D+ in metres / 100.',
    fr: 'Le kilomètre-effort est une mesure de la difficulté d’un parcours de trail qui ajoute un kilomètre par tranche de 100 mètres de dénivelé positif : km-effort = distance en km + D+ en mètres / 100.',
    es: 'El kilómetro-esfuerzo es una medida de la dificultad de un recorrido de trail que suma un kilómetro por cada 100 metros de desnivel positivo: km-esfuerzo = distancia en km + D+ en metros / 100.',
    it: 'Il km-sforzo è una misura della difficoltà di un percorso trail che aggiunge un chilometro ogni 100 metri di dislivello positivo: km-sforzo = distanza in km + D+ in metri / 100.',
    'pt-br':
      'O km-esforço é uma medida da dificuldade de um percurso de trail que soma um quilômetro a cada 100 metros de ganho de elevação: km-esforço = distância em km + D+ em metros / 100.',
  },
  aliases: {
    en: ['Kilometre-effort', 'Effort kilometres', 'km-e'],
    fr: ['Km-effort', 'Kilomètres-effort', 'km-e'],
    es: ['Km-esfuerzo', 'Kilómetros-esfuerzo', 'km-e'],
    it: ['Chilometro-sforzo', 'Km-effort'],
    'pt-br': ['Quilômetro-esforço', 'Km-effort'],
  },
  faq: {
    en: [
      {
        question: 'Does km-effort count the descent?',
        answer:
          'No. The usual formula only adds the ascent: km + D+ / 100. Descents give neither credit nor penalty, which is its main weakness on courses with long, steep downhills.',
      },
      {
        question: 'Is km-effort the same as the ITRA or UTMB index?',
        answer:
          'No. ITRA uses the same sum of distance plus D+ / 100 to classify races, but the ITRA performance index and the UTMB Index are scores of runners, built on their own models. Km-effort only describes a course.',
      },
      {
        question: 'What is a good pace per km-effort?',
        answer:
          'It depends on the terrain and the length of the race. Use it to compare yourself on similar courses: if your pace per km-effort drops over a training block on comparable terrain, your trail fitness is improving.',
      },
    ],
    fr: [
      {
        question: 'Le km-effort tient-il compte de la descente ?',
        answer:
          'Non. La formule courante n’ajoute que la montée : km + D+ / 100. La descente n’apporte ni bonus ni pénalité, ce qui est sa principale faiblesse sur les parcours aux longues descentes raides.',
      },
      {
        question:
          'Le km-effort est-il la même chose que la cote ITRA ou l’UTMB Index ?',
        answer:
          'Non. L’ITRA utilise la même somme, distance plus D+ / 100, pour classer les courses, mais la cote de performance ITRA et l’UTMB Index notent des coureurs, avec leurs propres modèles. Le km-effort ne décrit qu’un parcours.',
      },
      {
        question: 'Qu’est-ce qu’une bonne allure au km-effort ?',
        answer:
          'Cela dépend du terrain et de la longueur de la course. Servez-vous-en pour vous comparer à vous-même sur des parcours semblables : si votre allure au km-effort baisse au fil d’un bloc sur des terrains comparables, votre forme en trail progresse.',
      },
    ],
    es: [
      {
        question: '¿El km-esfuerzo tiene en cuenta la bajada?',
        answer:
          'No. La fórmula habitual solo suma la subida: km + D+ / 100. Las bajadas no suman ni restan, y esa es su principal debilidad en recorridos con bajadas largas y empinadas.',
      },
      {
        question: '¿El km-esfuerzo es lo mismo que el índice ITRA o UTMB?',
        answer:
          'No. La ITRA usa la misma suma, distancia más D+ / 100, para clasificar carreras, pero el índice de rendimiento ITRA y el UTMB Index puntúan a corredores con sus propios modelos. El km-esfuerzo solo describe un recorrido.',
      },
      {
        question: '¿Qué es un buen ritmo por km-esfuerzo?',
        answer:
          'Depende del terreno y de la duración de la carrera. Úsalo para compararte contigo en recorridos parecidos: si tu ritmo por km-esfuerzo baja a lo largo de un bloque en terrenos similares, tu forma en trail está mejorando.',
      },
    ],
    it: [
      {
        question: 'Il km-sforzo tiene conto della discesa?',
        answer:
          'No. La formula più usata somma solo la salita: km + D+ / 100. Le discese non danno né bonus né penalità, ed è il suo limite principale sui percorsi con discese lunghe e ripide.',
      },
      {
        question: 'Il km-sforzo è la stessa cosa dell’indice ITRA o UTMB?',
        answer:
          'No. L’ITRA usa la stessa somma, distanza più D+ / 100, per classificare le gare, ma l’indice di performance ITRA e l’UTMB Index danno un punteggio ai corridori con modelli propri. Il km-sforzo descrive solo un percorso.',
      },
      {
        question: 'Qual è un buon passo per km-sforzo?',
        answer:
          'Dipende dal terreno e dalla lunghezza della gara. Usalo per confrontarti con te stesso su percorsi simili: se il tuo passo per km-sforzo scende nel corso di un blocco su terreni paragonabili, la tua forma nel trail sta migliorando.',
      },
    ],
    'pt-br': [
      {
        question: 'O km-esforço leva em conta a descida?',
        answer:
          'Não. A fórmula mais comum só soma a subida: km + D+ / 100. As descidas não somam nem tiram, e esse é o principal ponto fraco em percursos com descidas longas e íngremes.',
      },
      {
        question: 'O km-esforço é a mesma coisa que o índice ITRA ou UTMB?',
        answer:
          'Não. A ITRA usa a mesma soma, distância mais D+ / 100, para classificar provas, mas o índice de performance ITRA e o UTMB Index pontuam corredores com modelos próprios. O km-esforço só descreve um percurso.',
      },
      {
        question: 'Qual é um bom pace por km-esforço?',
        answer:
          'Depende do terreno e da duração da prova. Use-o para se comparar com você mesmo em percursos parecidos: se o seu pace por km-esforço cai ao longo de um bloco em terrenos semelhantes, o seu condicionamento no trail está melhorando.',
      },
    ],
  },
  related: ['grade-adjusted-pace', 'negative-split', 'critical-speed', 'vma'],
  links: [
    '/tools/trail-time-estimator',
    '/training-plans/trail',
    '/tools/grade-adjusted-pace',
  ],
  sources: [
    {
      citation:
        'Riegel PS (1981). Athletic records and human endurance. American Scientist 69(3): 285–290.',
    },
  ],
  updatedAt: '2026-11-04',
  content: {
    en: ContentEn,
    fr: ContentFr,
    es: ContentEs,
    it: ContentIt,
    'pt-br': ContentPtBr,
  },
};

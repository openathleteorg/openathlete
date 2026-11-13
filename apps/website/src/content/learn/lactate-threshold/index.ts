import type { LearnTerm } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const lactateThreshold: LearnTerm = {
  slug: 'lactate-threshold',
  theme: 'intensity',
  name: {
    en: 'Lactate threshold',
    fr: 'Seuil lactique',
    es: 'Umbral de lactato',
    it: 'Soglia del lattato',
    'pt-br': 'Limiar de lactato',
    de: 'Laktatschwelle',
  },
  title: {
    en: 'Lactate threshold: definition, formula, example',
    fr: 'Qu’est-ce que le seuil lactique ? Définition, formule, exemple',
    es: '¿Qué es el umbral de lactato? Definición, fórmula y ejemplo',
    it: 'Cos’è la soglia del lattato? Definizione, formula, esempio',
    'pt-br': 'O que é limiar de lactato? Definição, fórmula e exemplo',
    de: 'Laktatschwelle: Definition, Formel, Beispiel',
  },
  description: {
    en: 'Lactate threshold explained: LT1 and LT2, the 4 mmol/L rule, a step test worked through with real numbers, threshold sessions and the limits of the test.',
    fr: 'Le seuil lactique expliqué : SL1 et SL2, la règle des 4 mmol/L, un test par paliers calculé pas à pas, les séances au seuil et les limites du test.',
    es: 'El umbral de lactato explicado: LT1 y LT2, la regla de 4 mmol/L, un test escalonado resuelto con números, sesiones de umbral y límites de la prueba.',
    it: 'La soglia del lattato spiegata: LT1 e LT2, la regola dei 4 mmol/L, un test incrementale calcolato passo per passo, sedute a soglia e limiti del test.',
    'pt-br':
      'O limiar de lactato explicado: LT1 e LT2, a regra dos 4 mmol/L, um teste progressivo calculado passo a passo, treinos de limiar e os limites do teste.',
    de: 'Laktatschwelle erklärt: LT1 und LT2, die 4-mmol-Regel, ein Stufentest mit echten Zahlen, Schwellentraining und die Grenzen des Tests.',
  },
  definition: {
    en: 'The lactate threshold is the exercise intensity at which blood lactate stops staying stable and starts to accumulate, used to separate easy, sustainable running from efforts you can only hold for a limited time.',
    fr: 'Le seuil lactique est l’intensité d’effort à partir de laquelle le lactate sanguin cesse d’être stable et commence à s’accumuler, ce qui sert à séparer l’effort facile et durable de celui qu’on ne tient qu’un temps limité.',
    es: 'El umbral de lactato es la intensidad de esfuerzo a partir de la cual el lactato en sangre deja de mantenerse estable y empieza a acumularse, y sirve para separar el esfuerzo cómodo y sostenible del que solo aguantas un tiempo limitado.',
    it: 'La soglia del lattato è l’intensità di sforzo oltre la quale il lattato nel sangue smette di restare stabile e comincia ad accumularsi, e serve a separare lo sforzo facile e sostenibile da quello che regge solo per un tempo limitato.',
    'pt-br':
      'O limiar de lactato é a intensidade de esforço a partir da qual o lactato no sangue deixa de ficar estável e começa a se acumular, usada para separar o esforço leve e sustentável daquele que só se aguenta por tempo limitado.',
    de: 'Die Laktatschwelle ist die Belastungsintensität, ab der das Blutlaktat nicht mehr stabil bleibt, sondern sich anhäuft. Sie trennt lockeres, dauerhaft haltbares Laufen von Belastungen, die du nur begrenzt halten kannst.',
  },
  aliases: {
    en: [
      'LT1 and LT2',
      'Anaerobic threshold',
      'Aerobic threshold',
      'Maximal lactate steady state',
    ],
    fr: [
      'Seuil anaérobie',
      'Seuil aérobie',
      'SL1 et SL2',
      'État stable maximal de lactate',
    ],
    es: [
      'Umbral anaeróbico',
      'Umbral aeróbico',
      'LT1 y LT2',
      'Máximo estado estable de lactato',
    ],
    it: [
      'Soglia anaerobica',
      'Soglia aerobica',
      'LT1 e LT2',
      'Massimo stato stazionario del lattato',
    ],
    'pt-br': [
      'Limiar anaeróbio',
      'Limiar aeróbio',
      'LT1 e LT2',
      'Máximo estado estável de lactato',
    ],
    de: [
      'LT1 und LT2',
      'Anaerobe Schwelle',
      'Aerobe Schwelle',
      'Maximaler Laktat-Steady-State',
    ],
  },
  faq: {
    en: [
      {
        question: 'How do I find my lactate threshold without a lab?',
        answer:
          'Use a race or a time trial. The pace you can hold for about an hour, usually between 10K and half marathon pace for trained runners, is a good estimate of the second threshold. A 30-minute solo time trial gives a slightly faster figure, close enough to set threshold sessions.',
      },
      {
        question:
          'Is the lactate threshold the same as the anaerobic threshold?',
        answer:
          'In everyday use, yes: both usually mean the second threshold (LT2), the highest intensity at which lactate still stabilises. The first threshold (LT1, or aerobic threshold) is a lower intensity, where lactate first rises above resting, and marks the top of easy running.',
      },
      {
        question: 'How often should I retest my threshold?',
        answer:
          'Every 6 to 10 weeks during a training block, or whenever a race suggests your fitness has moved. Zones built on a threshold from last season are often several seconds per kilometre off.',
      },
    ],
    fr: [
      {
        question: 'Comment connaître son seuil lactique sans laboratoire ?',
        answer:
          'Servez-vous d’une course ou d’un test chronométré. L’allure que vous tenez environ une heure, en général entre l’allure 10 km et l’allure semi pour un coureur entraîné, est une bonne estimation du second seuil. Un contre-la-montre de 30 minutes en solo donne une valeur un peu plus rapide, suffisante pour caler les séances au seuil.',
      },
      {
        question: 'Seuil lactique et seuil anaérobie, est-ce la même chose ?',
        answer:
          'Dans l’usage courant, oui : les deux désignent en général le second seuil (SL2), l’intensité la plus haute à laquelle le lactate se stabilise encore. Le premier seuil (SL1, ou seuil aérobie) est plus bas, là où le lactate commence à monter, et marque le haut de l’endurance fondamentale.',
      },
      {
        question: 'À quelle fréquence refaire un test de seuil ?',
        answer:
          'Toutes les 6 à 10 semaines pendant un bloc d’entraînement, ou dès qu’une course montre que votre forme a changé. Des zones calées sur un seuil de la saison précédente sont souvent décalées de plusieurs secondes au kilomètre.',
      },
    ],
    es: [
      {
        question: '¿Cómo sé mi umbral de lactato sin laboratorio?',
        answer:
          'Usa una carrera o una contrarreloj. El ritmo que aguantas durante una hora, normalmente entre el de 10K y el de media maratón en corredores entrenados, es una buena estimación del segundo umbral. Una contrarreloj en solitario de 30 minutos da un valor algo más rápido, suficiente para ajustar las sesiones de umbral.',
      },
      {
        question: '¿El umbral de lactato es lo mismo que el umbral anaeróbico?',
        answer:
          'En el uso diario, sí: los dos suelen referirse al segundo umbral (LT2), la intensidad más alta a la que el lactato todavía se estabiliza. El primer umbral (LT1, o umbral aeróbico) es más bajo, donde el lactato empieza a subir, y marca el techo del rodaje suave.',
      },
      {
        question: '¿Cada cuánto debo repetir la prueba de umbral?',
        answer:
          'Cada 6 a 10 semanas durante un bloque de entrenamiento, o cuando una carrera indique que tu forma ha cambiado. Unas zonas basadas en el umbral de la temporada pasada suelen estar desviadas varios segundos por kilómetro.',
      },
    ],
    it: [
      {
        question: 'Come trovo la mia soglia del lattato senza laboratorio?',
        answer:
          'Usa una gara o una prova cronometrata. Il ritmo che tieni per circa un’ora, di solito tra quello dei 10 km e quello della mezza per un podista allenato, è una buona stima della seconda soglia. Una cronometro da 30 minuti in solitaria dà un valore un po’ più veloce, sufficiente per impostare le sedute a soglia.',
      },
      {
        question: 'Soglia del lattato e soglia anaerobica sono la stessa cosa?',
        answer:
          'Nell’uso comune sì: entrambe indicano di solito la seconda soglia (LT2), l’intensità più alta alla quale il lattato si stabilizza ancora. La prima soglia (LT1, o soglia aerobica) è più bassa, dove il lattato comincia a salire, e segna il limite superiore della corsa facile.',
      },
      {
        question: 'Ogni quanto devo ripetere il test di soglia?',
        answer:
          'Ogni 6–10 settimane durante un blocco di allenamento, o quando una gara fa capire che la forma è cambiata. Zone basate sulla soglia della stagione scorsa sono spesso sballate di diversi secondi al chilometro.',
      },
    ],
    'pt-br': [
      {
        question: 'Como descobrir meu limiar de lactato sem laboratório?',
        answer:
          'Use uma prova ou um contrarrelógio. O pace que você sustenta por cerca de uma hora, em geral entre o pace de 10 km e o de meia maratona para corredores treinados, é uma boa estimativa do segundo limiar. Um contrarrelógio de 30 minutos sozinho dá um valor um pouco mais rápido, suficiente para ajustar os treinos de limiar.',
      },
      {
        question: 'Limiar de lactato e limiar anaeróbio são a mesma coisa?',
        answer:
          'No uso do dia a dia, sim: os dois costumam indicar o segundo limiar (LT2), a intensidade mais alta em que o lactato ainda se estabiliza. O primeiro limiar (LT1, ou limiar aeróbio) é mais baixo, onde o lactato começa a subir, e marca o teto da rodagem leve.',
      },
      {
        question: 'Com que frequência devo refazer o teste de limiar?',
        answer:
          'A cada 6 a 10 semanas durante um bloco de treino, ou quando uma prova mostrar que seu condicionamento mudou. Zonas baseadas no limiar da temporada passada costumam estar vários segundos por quilômetro fora.',
      },
    ],
    de: [
      {
        question: 'Wie finde ich meine Laktatschwelle ohne Labor?',
        answer:
          'Nutze einen Wettkampf oder einen Zeitlauf. Das Tempo, das du etwa eine Stunde halten kannst, bei trainierten Läufern meist zwischen 10-km- und Halbmarathontempo, ist eine gute Schätzung der zweiten Schwelle. Ein 30-minütiger Zeitlauf allein ergibt einen etwas schnelleren Wert, nah genug, um Schwelleneinheiten festzulegen.',
      },
      {
        question: 'Ist die Laktatschwelle dasselbe wie die anaerobe Schwelle?',
        answer:
          'Im Alltag ja: Beide meinen meist die zweite Schwelle (LT2), die höchste Intensität, bei der sich das Laktat noch stabilisiert. Die erste Schwelle (LT1 oder aerobe Schwelle) liegt bei niedrigerer Intensität, wo das Laktat erstmals über den Ruhewert steigt, und markiert die Obergrenze für lockeres Laufen.',
      },
      {
        question: 'Wie oft sollte ich meine Schwelle neu testen?',
        answer:
          'Alle 6 bis 10 Wochen während eines Trainingsblocks oder immer dann, wenn ein Wettkampf zeigt, dass sich deine Form verändert hat. Zonen, die auf einer Schwelle aus der letzten Saison beruhen, liegen oft mehrere Sekunden pro Kilometer daneben.',
      },
    ],
  },
  related: [
    'critical-speed',
    'zone-2',
    'ftp',
    'polarized-training',
    'heart-rate-reserve',
    'vma',
  ],
  links: [
    '/pace-charts',
    '/tools/heart-rate-zones',
    '/tools/pace-calculator',
    '/features/training-load',
  ],
  sources: [
    {
      citation:
        'Faude O, Kindermann W, Meyer T (2009). Lactate threshold concepts: how valid are they? Sports Medicine 39(6): 469–490.',
      url: 'https://doi.org/10.2165/00007256-200939060-00003',
    },
    {
      citation:
        'Jones AM, Burnley M, Black MI, Poole DC, Vanhatalo A (2019). The maximal metabolic steady state: redefining the ‘gold standard’. Physiological Reports 7(10): e14098.',
      url: 'https://doi.org/10.14814/phy2.14098',
    },
  ],
  updatedAt: '2026-11-04',
  content: {
    en: ContentEn,
    fr: ContentFr,
    es: ContentEs,
    it: ContentIt,
    'pt-br': ContentPtBr,
    de: ContentDe,
  },
};

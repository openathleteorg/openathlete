import type { LearnTerm } from '../types';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const vma: LearnTerm = {
  slug: 'vma',
  theme: 'intensity',
  name: {
    en: 'VMA (maximal aerobic speed)',
    fr: 'VMA (vitesse maximale aérobie)',
    es: 'VAM (velocidad aeróbica máxima)',
    it: 'VAM (velocità aerobica massima)',
    'pt-br': 'VAM (velocidade aeróbia máxima)',
  },
  title: {
    en: 'VMA (maximal aerobic speed): definition, formula, example',
    fr: 'Qu’est-ce que la VMA\u00a0? Définition, calcul, exemple',
    es: '¿Qué es la VAM? Definición, cálculo y ejemplo',
    it: 'Cos’è la VAM? Definizione, calcolo, esempio',
    'pt-br': 'O que é VAM? Definição, cálculo e exemplo',
  },
  description: {
    en: 'VMA, maximal aerobic speed, is the slowest pace that reaches your VO2max. How to calculate it with a 6-minute test or a race, and train at % of VMA.',
    fr: 'La VMA est la vitesse à laquelle vous atteignez votre VO2max. Calcul de la VMA avec un test de 6 minutes ou une course, et entraînement en % de VMA.',
    es: 'La VAM es la velocidad a la que alcanzas tu VO2max. Cómo calcularla con un test de 6 minutos o una carrera, y cómo entrenar en % de VAM.',
    it: 'La VAM è la velocità a cui raggiungi il tuo VO2max. Come calcolarla con un test di 6 minuti o una gara, e come allenarti in % di VAM.',
    'pt-br':
      'A VAM é a velocidade em que você atinge o seu VO2máx. Como calcular com um teste de 6 minutos ou uma prova, e como treinar em % da VAM.',
  },
  definition: {
    en: 'VMA (vitesse maximale aérobie, maximal aerobic speed) is the lowest running speed at which you reach your VO2max, usually held for 4 to 8 minutes, and the reference used to set interval paces as a percentage.',
    fr: 'La VMA (vitesse maximale aérobie) est la plus petite vitesse de course à laquelle vous atteignez votre VO2max, tenable en général 4 à 8 minutes, et la référence qui sert à fixer les allures de fractionné en pourcentage.',
    es: 'La VAM (velocidad aeróbica máxima) es la velocidad de carrera más baja a la que alcanzas tu VO2max, que suele aguantarse entre 4 y 8 minutos, y la referencia para fijar los ritmos de las series en porcentaje.',
    it: 'La VAM (velocità aerobica massima) è la velocità di corsa più bassa alla quale raggiungi il tuo VO2max, sostenibile di solito tra 4 e 8 minuti, e il riferimento per fissare i ritmi delle ripetute in percentuale.',
    'pt-br':
      'A VAM (velocidade aeróbia máxima) é a menor velocidade de corrida em que você atinge o seu VO2máx, sustentável em geral por 4 a 8 minutos, e a referência para definir o ritmo dos tiros em porcentagem.',
  },
  aliases: {
    en: ['Maximal aerobic speed', 'MAS', 'vVO2max', 'VMA'],
    fr: ['Vitesse maximale aérobie', 'vVO2max', 'Calcul VMA'],
    es: ['Velocidad aeróbica máxima', 'vVO2max', 'VMA'],
    it: ['Velocità aerobica massima', 'vVO2max', 'VMA'],
    'pt-br': ['Velocidade aeróbia máxima', 'vVO2máx', 'VMA'],
  },
  faq: {
    en: [
      {
        question: 'How do I calculate my VMA?',
        answer:
          'Run as far as you can in 6 minutes on a track after a good warm-up, then divide the distance by the time: 1,500 m in 6 minutes is 15 km/h. A recent flat 5K or 10K also works: divide your average speed by about 0.95 (5K) or 0.90 (10K).',
      },
      {
        question: 'What is a good VMA?',
        answer:
          'Many recreational runners sit between 12 and 16 km/h, trained club runners between 16 and 19, and elite distance runners above 21. It only matters relative to your own goals: VMA sets your training paces, it does not decide your marathon on its own.',
      },
      {
        question: 'How often should I retest VMA?',
        answer:
          'Every two to three months is enough for most runners, or at the start of each training block. Between tests, a race result or a well-paced interval session tells you whether your percentages still feel right.',
      },
    ],
    fr: [
      {
        question: 'Comment calculer sa VMA\u00a0?',
        answer:
          'Courez la plus grande distance possible en 6 minutes sur piste après un bon échauffement, puis divisez la distance par le temps\u00a0: 1\u00a0500\u00a0m en 6 minutes donnent 15\u00a0km/h. Un 5 ou 10\u00a0km récent et plat fonctionne aussi\u00a0: divisez votre vitesse moyenne par environ 0,95 (5\u00a0km) ou 0,90 (10\u00a0km).',
      },
      {
        question: 'Qu’est-ce qu’une bonne VMA\u00a0?',
        answer:
          'Beaucoup de coureurs loisirs se situent entre 12 et 16\u00a0km/h, les coureurs de club entraînés entre 16 et 19, et les meilleurs coureurs de fond au-delà de 21. La valeur n’a de sens que par rapport à vos objectifs\u00a0: la VMA fixe vos allures, elle ne décide pas seule de votre marathon.',
      },
      {
        question: 'À quelle fréquence refaire un test de VMA\u00a0?',
        answer:
          'Tous les deux à trois mois suffisent pour la plupart des coureurs, ou au début de chaque bloc. Entre deux tests, un résultat de course ou une séance de fractionné bien menée vous dit si vos pourcentages sont toujours justes.',
      },
    ],
    es: [
      {
        question: '¿Cómo calculo mi VAM?',
        answer:
          'Corre la mayor distancia posible en 6 minutos en pista tras un buen calentamiento y divide la distancia entre el tiempo: 1500 m en 6 minutos son 15 km/h. Un 5K o 10K reciente y llano también sirve: divide tu velocidad media entre 0,95 (5K) o 0,90 (10K), aproximadamente.',
      },
      {
        question: '¿Qué es una buena VAM?',
        answer:
          'Muchos corredores populares están entre 12 y 16 km/h, los corredores de club entrenados entre 16 y 19 y los fondistas de élite por encima de 21. Solo importa respecto a tus objetivos: la VAM fija tus ritmos, no decide por sí sola tu maratón.',
      },
      {
        question: '¿Cada cuánto debo repetir el test de VAM?',
        answer:
          'Cada dos o tres meses basta para la mayoría, o al empezar cada bloque. Entre test y test, una carrera o una sesión de series bien llevada te dice si tus porcentajes siguen siendo correctos.',
      },
    ],
    it: [
      {
        question: 'Come si calcola la VAM?',
        answer:
          'Corri la distanza più lunga possibile in 6 minuti su pista dopo un buon riscaldamento, poi dividi la distanza per il tempo: 1500 m in 6 minuti sono 15 km/h. Va bene anche un 5 o 10 km recente e pianeggiante: dividi la velocità media per circa 0,95 (5 km) o 0,90 (10 km).',
      },
      {
        question: 'Qual è una buona VAM?',
        answer:
          'Molti amatori stanno tra 12 e 16 km/h, i corridori di società allenati tra 16 e 19, i fondisti d’élite sopra 21. Conta solo rispetto ai tuoi obiettivi: la VAM fissa i ritmi di allenamento, non decide da sola la tua maratona.',
      },
      {
        question: 'Ogni quanto ripetere il test della VAM?',
        answer:
          'Ogni due o tre mesi basta per la maggior parte dei corridori, oppure all’inizio di ogni blocco. Tra un test e l’altro, una gara o una seduta di ripetute ben gestita ti dice se le percentuali sono ancora giuste.',
      },
    ],
    'pt-br': [
      {
        question: 'Como calcular a minha VAM?',
        answer:
          'Corra a maior distância possível em 6 minutos na pista depois de um bom aquecimento e divida a distância pelo tempo: 1.500 m em 6 minutos dão 15 km/h. Uma prova recente e plana de 5 ou 10 km também serve: divida a velocidade média por cerca de 0,95 (5 km) ou 0,90 (10 km).',
      },
      {
        question: 'Qual é uma boa VAM?',
        answer:
          'Muitos corredores amadores ficam entre 12 e 16 km/h, corredores de assessoria bem treinados entre 16 e 19, e fundistas de elite acima de 21. O número só importa em relação aos seus objetivos: a VAM define seus paces, não decide sozinha a sua maratona.',
      },
      {
        question: 'De quanto em quanto tempo refazer o teste de VAM?',
        answer:
          'A cada dois ou três meses basta para a maioria, ou no início de cada bloco. Entre um teste e outro, uma prova ou um treino de tiros bem executado mostra se as porcentagens continuam certas.',
      },
    ],
  },
  related: ['vo2max', 'vdot', 'trimp', 'hrv'],
  links: ['/tools/vma', '/tools/heart-rate-zones', '/pace-charts'],
  sources: [
    {
      citation:
        'Léger L, Boucher R (1980). An indirect continuous running multistage field test: the Université de Montréal track test. Canadian Journal of Applied Sport Sciences 5(2): 77–84.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/7389053/',
    },
    {
      citation:
        'Léger L, Mercier D (1984). Gross energy cost of horizontal treadmill and track running. Sports Medicine 1(4): 270–277.',
      url: 'https://doi.org/10.2165/00007256-198401040-00003',
    },
    {
      citation:
        'Billat LV, Koralsztein JP (1996). Significance of the velocity at VO2max and time to exhaustion at this velocity. Sports Medicine 22(2): 90–108.',
      url: 'https://doi.org/10.2165/00007256-199622020-00004',
    },
    {
      citation:
        'Billat LV (2001). Interval training for performance: a scientific and empirical practice (Part I). Sports Medicine 31(1): 13–31.',
      url: 'https://doi.org/10.2165/00007256-200131010-00002',
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

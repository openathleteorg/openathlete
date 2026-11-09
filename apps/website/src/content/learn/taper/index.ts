import type { LearnTerm } from '../types';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const taper: LearnTerm = {
  slug: 'taper',
  theme: 'racing',
  name: {
    en: 'Taper',
    fr: 'Affûtage',
    es: 'Tapering (puesta a punto)',
    it: 'Tapering (scarico pre-gara)',
    'pt-br': 'Polimento',
  },
  title: {
    en: 'Taper: definition, how long, worked example',
    fr: 'Qu’est-ce que l’affûtage\u00a0? Définition, durée, exemple',
    es: '¿Qué es el tapering? Definición, duración y ejemplo',
    it: 'Cos’è il tapering? Definizione, durata, esempio',
    'pt-br': 'O que é polimento? Definição, duração e exemplo',
  },
  description: {
    en: 'A taper cuts training volume before a race so fatigue drops faster than fitness. How long, how much to cut, and a worked example with CTL, ATL and TSB.',
    fr: 'L’affûtage réduit le volume avant une course pour que la fatigue baisse plus vite que la forme. Durée, ampleur de la baisse et exemple chiffré avec la TSB.',
    es: 'El tapering reduce el volumen antes de una carrera para que la fatiga baje más rápido que la forma. Duración, cuánto recortar y un ejemplo con CTL y TSB.',
    it: 'Il tapering riduce il volume prima di una gara perché la fatica scenda più in fretta della forma. Durata, quanto tagliare e un esempio con CTL e TSB.',
    'pt-br':
      'O polimento reduz o volume antes da prova para a fadiga cair mais rápido que o condicionamento. Duração, quanto cortar e um exemplo com CTL e TSB.',
  },
  definition: {
    en: 'A taper is the period of reduced training before a goal race, usually one to three weeks, in which volume drops while intensity is kept, so that accumulated fatigue clears faster than fitness is lost.',
    fr: 'L’affûtage est la période d’entraînement allégé qui précède une course objectif, en général d’une à trois semaines, pendant laquelle on baisse le volume en gardant l’intensité, pour que la fatigue accumulée disparaisse plus vite que la forme ne se perd.',
    es: 'El tapering es el periodo de entrenamiento reducido antes de una carrera objetivo, normalmente de una a tres semanas, en el que se baja el volumen y se mantiene la intensidad para que la fatiga acumulada desaparezca antes de que se pierda forma.',
    it: 'Il tapering è il periodo di allenamento ridotto prima di una gara obiettivo, di solito da una a tre settimane, in cui si taglia il volume mantenendo l’intensità, così che la fatica accumulata sparisca più in fretta di quanto si perda la forma.',
    'pt-br':
      'O polimento é o período de treino reduzido antes da prova-alvo, em geral de uma a três semanas, em que o volume cai e a intensidade se mantém, para que a fadiga acumulada desapareça mais rápido do que o condicionamento se perde.',
  },
  aliases: {
    en: ['Tapering', 'Pre-race taper'],
    fr: ['Taper', 'Tapering', 'Affûtage pré-compétition'],
    es: ['Taper', 'Puesta a punto', 'Afinamiento'],
    it: ['Taper', 'Scarico pre-gara', 'Rifinitura'],
    'pt-br': ['Taper', 'Tapering', 'Polimento pré-prova'],
  },
  faq: {
    en: [
      {
        question: 'How long should a marathon taper be?',
        answer:
          'Two to three weeks for most runners. A meta-analysis of 27 studies found two weeks worked best across sports, and an analysis of more than 158,000 recreational marathoners found that strict tapers of up to three weeks were linked to faster finishing times than shorter or looser ones.',
      },
      {
        question: 'Should I keep doing intervals during a taper?',
        answer:
          'Yes, shorter ones. The research is consistent that keeping intensity protects fitness while volume comes down: a few minutes at race pace or slightly faster, two or three times a week, is enough. Cut the number of repetitions, not their speed.',
      },
      {
        question: 'Why do I feel sluggish during my taper?',
        answer:
          'It is common. Fewer kilometres can leave you feeling flat, heavy or restless, and minor aches seem louder. It usually passes by race day. Resist the urge to test yourself with a hard session in the last week: the fitness is already there.',
      },
    ],
    fr: [
      {
        question: 'Combien de temps doit durer l’affûtage d’un marathon\u00a0?',
        answer:
          'Deux à trois semaines pour la plupart des coureurs. Une méta-analyse de 27 études a trouvé que deux semaines donnaient les meilleurs résultats, tous sports confondus, et l’analyse de plus de 158\u00a0000 marathoniens amateurs associe les affûtages stricts allant jusqu’à trois semaines à de meilleurs chronos que les affûtages plus courts ou plus relâchés.',
      },
      {
        question: 'Faut-il garder du fractionné pendant l’affûtage\u00a0?',
        answer:
          'Oui, en plus court. Les études s’accordent\u00a0: maintenir l’intensité préserve la forme pendant que le volume baisse. Quelques minutes à allure course ou un peu plus vite, deux ou trois fois par semaine, suffisent. Réduisez le nombre de répétitions, pas leur vitesse.',
      },
      {
        question: 'Pourquoi se sent-on lourd pendant l’affûtage\u00a0?',
        answer:
          'C’est fréquent. Moins de kilomètres peut donner une sensation de jambes lourdes, d’apathie ou d’agitation, et les petites douleurs semblent plus présentes. Cela passe en général d’ici le jour J. Ne cherchez pas à vous rassurer avec une séance dure la dernière semaine\u00a0: la forme est déjà là.',
      },
    ],
    es: [
      {
        question: '¿Cuánto debe durar el tapering de un maratón?',
        answer:
          'De dos a tres semanas para la mayoría. Un metaanálisis de 27 estudios encontró que dos semanas daban el mejor resultado en varios deportes, y un análisis de más de 158.000 maratonianos populares asoció los tapers estrictos de hasta tres semanas con mejores marcas que los más cortos o relajados.',
      },
      {
        question: '¿Hay que mantener las series durante el tapering?',
        answer:
          'Sí, más cortas. Los estudios coinciden en que mantener la intensidad conserva la forma mientras baja el volumen: unos minutos a ritmo de carrera o algo más rápido, dos o tres veces por semana, bastan. Recorta repeticiones, no velocidad.',
      },
      {
        question: '¿Por qué me siento pesado durante el tapering?',
        answer:
          'Es habitual. Con menos kilómetros puedes notar las piernas pesadas, apatía o nervios, y las pequeñas molestias parecen más fuertes. Suele pasar antes del día de la carrera. No intentes comprobar tu forma con una sesión dura la última semana: la forma ya está.',
      },
    ],
    it: [
      {
        question: 'Quanto deve durare il tapering per una maratona?',
        answer:
          'Da due a tre settimane per la maggior parte dei runner. Una meta-analisi di 27 studi ha trovato che due settimane davano il risultato migliore in vari sport, e un’analisi su oltre 158.000 maratoneti amatori ha associato i tapering rigorosi fino a tre settimane a tempi migliori rispetto a quelli più corti o meno disciplinati.',
      },
      {
        question: 'Durante il tapering si fanno ancora le ripetute?',
        answer:
          'Sì, più corte. Gli studi concordano: mantenere l’intensità conserva la forma mentre il volume scende. Qualche minuto a ritmo gara o poco più veloce, due o tre volte a settimana, basta. Taglia il numero di ripetute, non la velocità.',
      },
      {
        question: 'Perché durante il tapering mi sento pesante?',
        answer:
          'Succede spesso. Con meno chilometri le gambe possono sembrare pesanti, l’umore piatto o agitato, e i piccoli fastidi si sentono di più. Di solito passa entro il giorno della gara. Non cercare conferme con una seduta dura nell’ultima settimana: la forma c’è già.',
      },
    ],
    'pt-br': [
      {
        question: 'Quanto tempo deve durar o polimento para a maratona?',
        answer:
          'De duas a três semanas para a maioria. Uma meta-análise de 27 estudos encontrou o melhor resultado com duas semanas, em vários esportes, e uma análise de mais de 158 mil maratonistas amadores associou polimentos rigorosos de até três semanas a tempos melhores que os mais curtos ou mais soltos.',
      },
      {
        question: 'Devo manter os tiros durante o polimento?',
        answer:
          'Sim, mais curtos. Os estudos concordam que manter a intensidade preserva o condicionamento enquanto o volume cai: alguns minutos no pace de prova ou um pouco mais rápido, duas ou três vezes por semana, bastam. Corte repetições, não velocidade.',
      },
      {
        question: 'Por que me sinto pesado durante o polimento?',
        answer:
          'É comum. Com menos quilômetros, as pernas podem parecer pesadas, o humor fica apático ou ansioso, e pequenas dores parecem maiores. Costuma passar até o dia da prova. Não tente se testar com um treino forte na última semana: o condicionamento já está lá.',
      },
    ],
  },
  related: ['ctl-atl-tsb', 'trimp', 'session-rpe', 'hrv'],
  links: [
    '/features/training-load',
    '/features/training-calendar',
    '/blog/prepping-for-a-goal-adapting-when-life-happens',
    '/training-plans',
  ],
  sources: [
    {
      citation:
        'Bosquet L, Montpetit J, Arvisais D, Mujika I (2007). Effects of tapering on performance: a meta-analysis. Medicine & Science in Sports & Exercise 39(8): 1358–1365.',
      url: 'https://doi.org/10.1249/mss.0b013e31806010e0',
    },
    {
      citation:
        'Mujika I, Padilla S (2003). Scientific bases for precompetition tapering strategies. Medicine & Science in Sports & Exercise 35(7): 1182–1187.',
      url: 'https://doi.org/10.1249/01.MSS.0000074448.73931.11',
    },
    {
      citation:
        'Smyth B, Lawlor A (2021). Longer disciplined tapers improve marathon performance for recreational runners. Frontiers in Sports and Active Living 3: 735220.',
      url: 'https://doi.org/10.3389/fspor.2021.735220',
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

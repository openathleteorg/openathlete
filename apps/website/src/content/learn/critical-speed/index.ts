import type { LearnTerm } from '../types';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const criticalSpeed: LearnTerm = {
  slug: 'critical-speed',
  theme: 'intensity',
  name: {
    en: 'Critical speed',
    fr: 'Vitesse critique',
    es: 'Velocidad crítica',
    it: 'Velocità critica',
    'pt-br': 'Velocidade crítica',
  },
  title: {
    en: 'Critical speed: definition, formula, example',
    fr: 'Qu’est-ce que la vitesse critique ? Définition, formule, exemple',
    es: '¿Qué es la velocidad crítica? Definición, fórmula y ejemplo',
    it: 'Cos’è la velocità critica? Definizione, formula, esempio',
    'pt-br': 'O que é velocidade crítica? Definição, fórmula e exemplo',
  },
  description: {
    en: 'Critical speed and D′ from your best efforts: the distance-time model, a worked example from four race times, how to use it for intervals, and its limits.',
    fr: 'Vitesse critique et D′ à partir de vos meilleurs efforts : le modèle distance-temps, un exemple sur quatre chronos, l’usage en fractionné, les limites.',
    es: 'Velocidad crítica y D′ a partir de tus mejores esfuerzos: el modelo distancia-tiempo, un ejemplo con cuatro marcas, cómo usarla en series y sus límites.',
    it: 'Velocità critica e D′ dai tuoi migliori sforzi: il modello distanza-tempo, un esempio su quattro tempi, l’uso nelle ripetute e i limiti.',
    'pt-br':
      'Velocidade crítica e D′ a partir dos seus melhores esforços: o modelo distância-tempo, um exemplo com quatro tempos, como usar nos tiros e seus limites.',
  },
  definition: {
    en: 'Critical speed is the slope of the line linking distance and time across your best efforts of about 2 to 20 minutes, the highest speed at which your body can still reach a steady state.',
    fr: 'La vitesse critique est la pente de la droite qui relie distance et temps sur vos meilleurs efforts de 2 à 20 minutes environ, la vitesse la plus élevée à laquelle l’organisme peut encore atteindre un état stable.',
    es: 'La velocidad crítica es la pendiente de la recta que une distancia y tiempo en tus mejores esfuerzos de unos 2 a 20 minutos, la velocidad más alta a la que el organismo todavía alcanza un estado estable.',
    it: 'La velocità critica è la pendenza della retta che lega distanza e tempo nei tuoi migliori sforzi da circa 2 a 20 minuti, la velocità più alta alla quale l’organismo riesce ancora a raggiungere uno stato stazionario.',
    'pt-br':
      'A velocidade crítica é a inclinação da reta que liga distância e tempo nos seus melhores esforços de cerca de 2 a 20 minutos, a maior velocidade em que o organismo ainda atinge um estado estável.',
  },
  aliases: {
    en: ['CS', 'D prime', 'Critical velocity'],
    fr: ['VC', 'D prime', 'Vitesse critique de course'],
    es: ['VC', 'D prima', 'Critical speed'],
    it: ['VC', 'D primo', 'Critical speed'],
    'pt-br': ['VC', 'D linha', 'Critical speed'],
  },
  faq: {
    en: [
      {
        question: 'How long can you run at critical speed?',
        answer:
          'Not indefinitely. Critical speed is a boundary, not a cruising pace: right at it, fatigue still builds, and how long people last varies a lot from one runner to the next. Most races of an hour or more are run below it.',
      },
      {
        question: 'Is critical speed the same as threshold pace?',
        answer:
          'They are close but not identical. Critical speed sits slightly above the maximal lactate steady state, which is the strict version of the lactate threshold. For a session plan, threshold work is usually a little slower than critical speed.',
      },
      {
        question: 'Which efforts should I use to calculate it?',
        answer:
          'At least three maximal efforts lasting between about 2 and 20 minutes, spread across that range, for example 1,000 m, 3,000 m and 5,000 m. Run on flat ground, without a strong wind, and recent enough to reflect your current fitness.',
      },
    ],
    fr: [
      {
        question: 'Combien de temps peut-on courir à la vitesse critique ?',
        answer:
          'Pas indéfiniment. La vitesse critique est une frontière, pas une allure de croisière : juste à cette vitesse, la fatigue s’accumule quand même, et la durée tenue varie beaucoup d’un coureur à l’autre. La plupart des courses d’une heure ou plus se courent en dessous.',
      },
      {
        question: 'La vitesse critique, est-ce l’allure seuil ?',
        answer:
          'Elles sont proches, sans être identiques. La vitesse critique se situe un peu au-dessus de l’état stable maximal de lactate, la version stricte du seuil lactique. Dans un plan, le travail au seuil se fait en général un peu moins vite que la vitesse critique.',
      },
      {
        question: 'Quels efforts utiliser pour la calculer ?',
        answer:
          'Au moins trois efforts maximaux de 2 à 20 minutes environ, répartis sur cette plage, par exemple 1 000 m, 3 000 m et 5 000 m. Sur terrain plat, sans vent fort, et assez récents pour refléter votre forme actuelle.',
      },
    ],
    es: [
      {
        question: '¿Cuánto tiempo se puede correr a velocidad crítica?',
        answer:
          'No de forma indefinida. La velocidad crítica es una frontera, no un ritmo de crucero: justo a esa velocidad la fatiga sigue acumulándose, y lo que aguanta cada corredor varía mucho. La mayoría de carreras de una hora o más se corren por debajo.',
      },
      {
        question: '¿La velocidad crítica es el ritmo de umbral?',
        answer:
          'Están cerca, pero no son lo mismo. La velocidad crítica queda un poco por encima del máximo estado estable de lactato, la versión estricta del umbral de lactato. En un plan, el trabajo de umbral suele hacerse algo más lento que la velocidad crítica.',
      },
      {
        question: '¿Qué esfuerzos uso para calcularla?',
        answer:
          'Al menos tres esfuerzos máximos de entre 2 y 20 minutos, repartidos por ese rango, por ejemplo 1.000 m, 3.000 m y 5.000 m. En llano, sin viento fuerte y lo bastante recientes para reflejar tu forma actual.',
      },
    ],
    it: [
      {
        question: 'Per quanto tempo si corre alla velocità critica?',
        answer:
          'Non all’infinito. La velocità critica è un confine, non un ritmo di crociera: proprio a quella velocità la fatica si accumula comunque, e la durata varia molto da un podista all’altro. La maggior parte delle gare da un’ora in su si corre sotto.',
      },
      {
        question: 'La velocità critica è il ritmo soglia?',
        answer:
          'Sono vicini, ma non uguali. La velocità critica sta un po’ sopra il massimo stato stazionario del lattato, la versione rigorosa della soglia del lattato. In un programma, il lavoro a soglia si fa di solito un po’ più piano della velocità critica.',
      },
      {
        question: 'Quali sforzi usare per calcolarla?',
        answer:
          'Almeno tre sforzi massimali tra circa 2 e 20 minuti, distribuiti su quell’intervallo, per esempio 1000 m, 3000 m e 5000 m. In piano, senza vento forte e abbastanza recenti da riflettere la forma attuale.',
      },
    ],
    'pt-br': [
      {
        question: 'Por quanto tempo dá para correr na velocidade crítica?',
        answer:
          'Não indefinidamente. A velocidade crítica é uma fronteira, não um ritmo de cruzeiro: bem nela, a fadiga continua se acumulando, e quanto cada corredor aguenta varia muito. A maioria das provas de uma hora ou mais é corrida abaixo dela.',
      },
      {
        question: 'Velocidade crítica é o mesmo que pace de limiar?',
        answer:
          'São próximos, mas não iguais. A velocidade crítica fica um pouco acima do máximo estado estável de lactato, a versão rigorosa do limiar de lactato. Na planilha, o treino de limiar costuma ser um pouco mais lento que a velocidade crítica.',
      },
      {
        question: 'Quais esforços usar para calcular?',
        answer:
          'Pelo menos três esforços máximos de cerca de 2 a 20 minutos, espalhados nessa faixa, por exemplo 1.000 m, 3.000 m e 5.000 m. Em terreno plano, sem vento forte e recentes o bastante para refletir seu condicionamento atual.',
      },
    ],
  },
  related: [
    'lactate-threshold',
    'ftp',
    'vma',
    'zone-2',
    'polarized-training',
    'negative-split',
  ],
  links: ['/tools/race-predictor', '/pace-charts', '/tools/vma', '/features'],
  sources: [
    {
      citation:
        'Monod H, Scherrer J (1965). The work capacity of a synergic muscular group. Ergonomics 8(3): 329–338.',
      url: 'https://doi.org/10.1080/00140136508930810',
    },
    {
      citation:
        'Jones AM, Vanhatalo A, Burnley M, Morton RH, Poole DC (2010). Critical power: implications for determination of V̇O2max and exercise tolerance. Medicine & Science in Sports & Exercise 42(10): 1876–1890.',
      url: 'https://doi.org/10.1249/MSS.0b013e3181d9cf7f',
    },
    {
      citation:
        'Poole DC, Burnley M, Vanhatalo A, Rossiter HB, Jones AM (2016). Critical power: an important fatigue threshold in exercise physiology. Medicine & Science in Sports & Exercise 48(11): 2320–2334.',
      url: 'https://doi.org/10.1249/MSS.0000000000000939',
    },
    {
      citation:
        'Jones AM, Vanhatalo A (2017). The ‘critical power’ concept: applications to sports performance with a focus on intermittent high-intensity exercise. Sports Medicine 47(Suppl 1): 65–78.',
      url: 'https://doi.org/10.1007/s40279-017-0688-0',
    },
    {
      citation:
        'Smyth B, Muniz-Pumares D (2020). Calculation of critical speed from raw training data in recreational marathon runners. Medicine & Science in Sports & Exercise 52(12): 2637–2645.',
      url: 'https://doi.org/10.1249/MSS.0000000000002412',
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

import type { LearnTerm } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const heartRateReserve: LearnTerm = {
  slug: 'heart-rate-reserve',
  theme: 'intensity',
  name: {
    en: 'Heart rate reserve',
    fr: 'Fréquence cardiaque de réserve',
    es: 'Frecuencia cardíaca de reserva',
    it: 'Frequenza cardiaca di riserva',
    'pt-br': 'Frequência cardíaca de reserva',
    de: 'Herzfrequenzreserve',
  },
  title: {
    en: 'Heart rate reserve: definition, formula, example',
    fr: 'Fréquence cardiaque de réserve : définition, formule, exemple',
    es: 'Frecuencia cardíaca de reserva: definición, fórmula y ejemplo',
    it: 'Frequenza cardiaca di riserva: definizione, formula, esempio',
    'pt-br': 'Frequência cardíaca de reserva: definição, fórmula e exemplo',
    de: 'Herzfrequenzreserve: Definition, Formel und Beispiel',
  },
  description: {
    en: 'Heart rate reserve is max minus resting heart rate. The Karvonen formula, the five zones in bpm and a worked example, with what the method misses.',
    fr: 'La FC de réserve, c’est la FC max moins la FC de repos. Formule de Karvonen, les cinq zones en bpm, un exemple chiffré et les limites de la méthode.',
    es: 'La frecuencia cardíaca de reserva es el máximo menos el pulso en reposo. Fórmula de Karvonen, las cinco zonas en ppm y un ejemplo resuelto.',
    it: 'La frequenza cardiaca di riserva è la massima meno quella a riposo. Formula di Karvonen, le cinque zone in bpm e un esempio di calcolo.',
    'pt-br':
      'A frequência cardíaca de reserva é a máxima menos a de repouso. Fórmula de Karvonen, as cinco zonas em bpm e um exemplo de cálculo.',
    de: 'Die Herzfrequenzreserve ist HFmax minus Ruhepuls. Die Karvonen-Formel, die fünf Zonen in bpm und ein Rechenbeispiel, plus das, was die Methode übersieht.',
  },
  definition: {
    en: 'Heart rate reserve is the difference between your maximum and resting heart rate, used by the Karvonen method to set training intensities as a share of that range rather than of maximum heart rate alone.',
    fr: 'La fréquence cardiaque de réserve est l’écart entre votre fréquence cardiaque maximale et votre fréquence de repos ; la méthode de Karvonen s’en sert pour fixer les intensités d’entraînement en part de cette plage plutôt qu’en part de la seule FC max.',
    es: 'La frecuencia cardíaca de reserva es la diferencia entre tu frecuencia cardíaca máxima y la de reposo, que el método de Karvonen usa para fijar las intensidades de entrenamiento como fracción de ese margen y no solo del máximo.',
    it: 'La frequenza cardiaca di riserva è la differenza tra la tua frequenza cardiaca massima e quella a riposo, che il metodo di Karvonen usa per fissare le intensità di allenamento come quota di questo margine invece che della sola massima.',
    'pt-br':
      'A frequência cardíaca de reserva é a diferença entre a sua frequência cardíaca máxima e a de repouso, usada pelo método de Karvonen para definir as intensidades de treino como fração dessa faixa, e não só da máxima.',
    de: 'Die Herzfrequenzreserve ist die Differenz zwischen deiner maximalen Herzfrequenz und deinem Ruhepuls. Die Karvonen-Methode nutzt sie, um Trainingsintensitäten als Anteil dieses Bereichs statt nur als Anteil der HFmax festzulegen.',
  },
  aliases: {
    en: ['HRR', 'Karvonen formula', 'Karvonen method'],
    fr: ['FCR', 'FC de réserve', 'Formule de Karvonen', 'Réserve cardiaque'],
    es: ['FCR', 'Fórmula de Karvonen', 'Método de Karvonen'],
    it: ['FCR', 'Formula di Karvonen', 'Metodo di Karvonen'],
    'pt-br': ['FCR', 'Fórmula de Karvonen', 'Método de Karvonen'],
    de: ['HFR', 'Karvonen-Formel', 'Karvonen-Methode', 'HRR'],
  },
  faq: {
    en: [
      {
        question: 'What is a normal heart rate reserve?',
        answer:
          'It depends on age and fitness. A 30-year-old resting at 60 with a maximum of 190 has a reserve of 130 beats. Endurance training lowers resting heart rate, so the reserve tends to grow with fitness, while maximum heart rate slowly falls with age.',
      },
      {
        question: 'Is Karvonen better than a percentage of max heart rate?',
        answer:
          'It is usually more personal, because it accounts for resting heart rate, and a percentage of reserve tracks a percentage of oxygen uptake reserve more closely. Both still use fixed percentages. If you know your threshold heart rate, zones anchored on it are more accurate than either.',
      },
      {
        question: 'Should I use the resting heart rate my watch shows?',
        answer:
          'You can, as long as you use it consistently. Watches often report the lowest value during sleep, a few beats below a morning reading lying in bed, which makes the reserve slightly larger and the zones slightly higher.',
      },
    ],
    fr: [
      {
        question: 'Quelle est une FC de réserve normale ?',
        answer:
          'Elle dépend de l’âge et du niveau. À 30 ans, avec 60 au repos et 190 au maximum, la réserve est de 130 battements. L’entraînement en endurance fait baisser la FC de repos, donc la réserve a tendance à grandir avec la forme, tandis que la FC max baisse lentement avec l’âge.',
      },
      {
        question: 'Karvonen est-il meilleur qu’un pourcentage de la FC max ?',
        answer:
          'Il est en général plus personnel, puisqu’il tient compte de la FC de repos, et un pourcentage de réserve suit de plus près un pourcentage de la réserve de consommation d’oxygène. Les deux reposent toutefois sur des pourcentages fixes. Si vous connaissez votre FC au seuil, des zones calées dessus sont plus justes que l’une ou l’autre méthode.',
      },
      {
        question: 'Faut-il utiliser la FC de repos affichée par la montre ?',
        answer:
          'Oui, tant que vous restez cohérent. Les montres donnent souvent le minimum pendant le sommeil, quelques battements sous une mesure faite au réveil, ce qui agrandit un peu la réserve et remonte légèrement les zones.',
      },
    ],
    es: [
      {
        question: '¿Cuál es una frecuencia cardíaca de reserva normal?',
        answer:
          'Depende de la edad y del nivel. Con 30 años, 60 en reposo y 190 de máximo, la reserva es de 130 pulsaciones. El entrenamiento de resistencia baja el pulso en reposo, así que la reserva suele crecer con la forma, mientras que el máximo baja poco a poco con la edad.',
      },
      {
        question: '¿Es mejor Karvonen que un porcentaje del pulso máximo?',
        answer:
          'Suele ser más personal, porque tiene en cuenta el pulso en reposo, y un porcentaje de la reserva sigue más de cerca un porcentaje de la reserva de consumo de oxígeno. Aun así, los dos usan porcentajes fijos. Si conoces tu pulso en el umbral, unas zonas ancladas en él son más precisas que cualquiera de los dos.',
      },
      {
        question: '¿Uso el pulso en reposo que marca mi reloj?',
        answer:
          'Puedes, siempre que lo hagas de forma constante. Los relojes suelen dar el mínimo durante el sueño, unas pulsaciones por debajo de una medida tumbado al despertar, lo que agranda un poco la reserva y sube ligeramente las zonas.',
      },
    ],
    it: [
      {
        question: 'Qual è una frequenza cardiaca di riserva normale?',
        answer:
          'Dipende da età e allenamento. A 30 anni, con 60 a riposo e 190 di massima, la riserva è di 130 battiti. L’allenamento di resistenza abbassa la frequenza a riposo, quindi la riserva tende a crescere con la forma, mentre la massima cala lentamente con l’età.',
      },
      {
        question:
          'Karvonen è meglio di una percentuale della frequenza massima?',
        answer:
          'Di solito è più personale, perché tiene conto della frequenza a riposo, e una percentuale della riserva segue più da vicino una percentuale della riserva di consumo di ossigeno. Entrambi però usano percentuali fisse. Se conosci la tua frequenza alla soglia, zone ancorate lì sono più precise di tutti e due.',
      },
      {
        question: 'Devo usare la frequenza a riposo dell’orologio?',
        answer:
          'Puoi, purché la usi sempre allo stesso modo. Gli orologi spesso riportano il minimo durante il sonno, qualche battito sotto una misura presa sdraiati al risveglio, il che allarga un po’ la riserva e alza leggermente le zone.',
      },
    ],
    'pt-br': [
      {
        question: 'Qual é uma frequência cardíaca de reserva normal?',
        answer:
          'Depende da idade e do condicionamento. Aos 30 anos, com 60 em repouso e 190 de máxima, a reserva é de 130 batimentos. O treino de resistência baixa a frequência de repouso, então a reserva tende a crescer com o condicionamento, enquanto a máxima cai devagar com a idade.',
      },
      {
        question: 'Karvonen é melhor que um percentual da frequência máxima?',
        answer:
          'Costuma ser mais individual, porque considera a frequência de repouso, e um percentual da reserva acompanha mais de perto um percentual da reserva de consumo de oxigênio. Mesmo assim, os dois usam percentuais fixos. Se você conhece a sua frequência no limiar, zonas ancoradas nela são mais precisas que qualquer um dos dois.',
      },
      {
        question: 'Posso usar a frequência de repouso que o relógio mostra?',
        answer:
          'Pode, desde que use sempre a mesma referência. Os relógios costumam mostrar o mínimo durante o sono, alguns batimentos abaixo de uma medida feita deitado ao acordar, o que aumenta um pouco a reserva e sobe levemente as zonas.',
      },
    ],
    de: [
      {
        question: 'Was ist eine normale Herzfrequenzreserve?',
        answer:
          'Das hängt von Alter und Trainingszustand ab. Ein 30-Jähriger mit einem Ruhepuls von 60 und einer HFmax von 190 hat eine Reserve von 130 Schlägen. Ausdauertraining senkt den Ruhepuls, die Reserve wächst also tendenziell mit der Fitness, während die HFmax mit dem Alter langsam sinkt.',
      },
      {
        question: 'Ist Karvonen besser als ein Prozentsatz der HFmax?',
        answer:
          'Meist ist die Methode individueller, weil sie den Ruhepuls berücksichtigt, und ein Prozentsatz der Reserve entspricht einem Prozentsatz der Sauerstoffaufnahmereserve genauer. Beide arbeiten aber mit festen Prozentwerten. Wenn du deine Schwellenherzfrequenz kennst, sind Zonen, die darauf beruhen, genauer als beide.',
      },
      {
        question: 'Soll ich den Ruhepuls verwenden, den meine Uhr anzeigt?',
        answer:
          'Ja, solange du ihn konsequent verwendest. Uhren melden oft den niedrigsten Wert im Schlaf, ein paar Schläge unter einer Messung morgens im Bett. Dadurch wird die Reserve etwas größer und die Zonen liegen etwas höher.',
      },
    ],
  },
  related: [
    'zone-2',
    'trimp',
    'lactate-threshold',
    'polarized-training',
    'ftp',
  ],
  links: [
    '/tools/heart-rate-zones',
    '/features/training-load',
    '/features/workout-builder',
  ],
  sources: [
    {
      citation:
        'Karvonen MJ, Kentala E, Mustala O (1957). The effects of training on heart rate; a longitudinal study. Annales Medicinae Experimentalis et Biologiae Fenniae 35(3): 307–315.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/13470504/',
    },
    {
      citation:
        'Swain DP, Leutholtz BC (1997). Heart rate reserve is equivalent to %VO2 reserve, not to %VO2max. Medicine & Science in Sports & Exercise 29(3): 410–414.',
      url: 'https://doi.org/10.1097/00005768-199703000-00018',
    },
    {
      citation:
        'Tanaka H, Monahan KD, Seals DR (2001). Age-predicted maximal heart rate revisited. Journal of the American College of Cardiology 37(1): 153–156.',
      url: 'https://doi.org/10.1016/S0735-1097(00)01054-8',
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

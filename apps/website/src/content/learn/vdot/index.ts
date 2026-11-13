import type { LearnTerm } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const vdot: LearnTerm = {
  slug: 'vdot',
  theme: 'intensity',
  name: {
    en: 'VDOT',
    fr: 'VDOT',
    es: 'VDOT',
    it: 'VDOT',
    'pt-br': 'VDOT',
    de: 'VDOT',
  },
  title: {
    en: 'VDOT: definition, formula, example',
    fr: 'Qu’est-ce que le VDOT\u00a0? Définition, formule, exemple',
    es: '¿Qué es el VDOT? Definición, fórmula y ejemplo',
    it: 'Cos’è il VDOT? Definizione, formula, esempio',
    'pt-br': 'O que é VDOT? Definição, fórmula e exemplo',
    de: 'VDOT: Definition, Formel, Beispiel',
  },
  description: {
    en: 'VDOT is Jack Daniels’ running fitness score from a race result. The Daniels-Gilbert formula, a 10K worked example and the training paces it gives.',
    fr: 'Le VDOT est l’indice de niveau de Jack Daniels, tiré d’un chrono. Formule de Daniels et Gilbert, exemple sur 10 km et allures d’entraînement.',
    es: 'El VDOT es el índice de nivel de Jack Daniels a partir de una marca. Fórmula de Daniels y Gilbert, ejemplo con un 10K y ritmos de entrenamiento.',
    it: 'Il VDOT è l’indice di Jack Daniels ricavato da un tempo di gara. Formula di Daniels e Gilbert, esempio su 10 km e ritmi di allenamento.',
    'pt-br':
      'O VDOT é o índice de Jack Daniels calculado a partir de um tempo de prova. Fórmula de Daniels e Gilbert, exemplo com 10 km e paces de treino.',
    de: 'VDOT ist der Leistungswert von Jack Daniels aus einer Wettkampfzeit. Die Formel von Daniels und Gilbert, ein 10-km-Beispiel und die Trainingspaces.',
  },
  definition: {
    en: 'VDOT is a running fitness score devised by Jack Daniels and Jimmy Gilbert: the VO2max that would explain a race result if your running economy were average, used to predict times at other distances and to set training paces.',
    fr: 'Le VDOT est un indice de niveau en course à pied conçu par Jack Daniels et Jimmy Gilbert\u00a0: la VO2max qui expliquerait un chrono si votre économie de course était moyenne, utilisée pour prédire vos temps sur d’autres distances et fixer vos allures d’entraînement.',
    es: 'El VDOT es un índice de nivel en carrera ideado por Jack Daniels y Jimmy Gilbert: el VO2max que explicaría una marca si tu economía de carrera fuera la media, y que sirve para predecir tiempos en otras distancias y fijar ritmos de entrenamiento.',
    it: 'Il VDOT è un indice di livello nella corsa ideato da Jack Daniels e Jimmy Gilbert: il VO2max che spiegherebbe un tempo di gara se la tua economia di corsa fosse nella media, usato per prevedere i tempi su altre distanze e fissare i ritmi di allenamento.',
    'pt-br':
      'O VDOT é um índice de nível na corrida criado por Jack Daniels e Jimmy Gilbert: o VO2máx que explicaria um tempo de prova se a sua economia de corrida fosse média, usado para prever tempos em outras distâncias e definir paces de treino.',
    de: 'VDOT ist ein Leistungswert für Läufer, entwickelt von Jack Daniels und Jimmy Gilbert: die VO2max, die ein Wettkampfergebnis bei durchschnittlicher Laufökonomie erklären würde. Er dient dazu, Zeiten auf anderen Distanzen vorherzusagen und Trainingspaces festzulegen.',
  },
  aliases: {
    en: ['Daniels VDOT', 'V-dot-O2max', 'Pseudo VO2max'],
    fr: ['VDOT de Daniels', 'Pseudo-VO2max'],
    es: ['VDOT de Daniels', 'Pseudo VO2max'],
    it: ['VDOT di Daniels', 'Pseudo VO2max'],
    'pt-br': ['VDOT de Daniels', 'Pseudo VO2máx'],
    de: ['VDOT nach Daniels', 'V-dot-O2max', 'Pseudo-VO2max'],
  },
  faq: {
    en: [
      {
        question: 'Is VDOT the same as VO2max?',
        answer:
          'No. VO2max is measured in a lab from the oxygen you consume. VDOT is worked back from a race time and folds in your running economy and how well you sustain a share of your maximum. Two runners with the same VO2max can have very different VDOTs.',
      },
      {
        question: 'What is a good VDOT?',
        answer:
          'It depends on age, sex and experience. As a reference, a 10K in 50:00 gives a VDOT of about 40, a 10K in 45:00 about 45 and a 10K in 40:00 about 52. World-class distance runners sit in the 80s.',
      },
      {
        question: 'Which race should I use to calculate my VDOT?',
        answer:
          'A recent, flat, all-out race between 5K and the half marathon. Shorter efforts lean on anaerobic capacity, and a marathon depends on fuelling and heat, so both distort the estimate. Update it after each good race or every couple of months.',
      },
    ],
    fr: [
      {
        question: 'Le VDOT est-il la même chose que la VO2max\u00a0?',
        answer:
          'Non. La VO2max se mesure en laboratoire, à partir de l’oxygène consommé. Le VDOT se déduit d’un chrono et intègre votre économie de course et la part de votre maximum que vous savez tenir. Deux coureurs à VO2max égale peuvent avoir des VDOT très différents.',
      },
      {
        question: 'Qu’est-ce qu’un bon VDOT\u00a0?',
        answer:
          'Cela dépend de l’âge, du sexe et de l’expérience. Pour repère, un 10 km en 50:00 donne un VDOT d’environ 40, un 10 km en 45:00 environ 45, un 10 km en 40:00 environ 52. Les meilleurs coureurs de fond mondiaux se situent au-delà de 80.',
      },
      {
        question: 'Quelle course utiliser pour calculer son VDOT\u00a0?',
        answer:
          'Une course récente, plate et courue à fond, entre le 5 km et le semi-marathon. Les efforts plus courts sollicitent la capacité anaérobie, et le marathon dépend du ravitaillement et de la chaleur\u00a0: les deux faussent l’estimation. Mettez-le à jour après chaque bonne course ou tous les deux mois environ.',
      },
    ],
    es: [
      {
        question: '¿El VDOT es lo mismo que el VO2max?',
        answer:
          'No. El VO2max se mide en laboratorio a partir del oxígeno que consumes. El VDOT se calcula hacia atrás desde una marca e incluye tu economía de carrera y la parte de tu máximo que eres capaz de sostener. Dos corredores con el mismo VO2max pueden tener VDOT muy distintos.',
      },
      {
        question: '¿Qué es un buen VDOT?',
        answer:
          'Depende de la edad, el sexo y la experiencia. Como referencia, un 10K en 50:00 da un VDOT de unos 40, un 10K en 45:00 unos 45 y un 10K en 40:00 unos 52. Los mejores fondistas del mundo están por encima de 80.',
      },
      {
        question: '¿Qué carrera uso para calcular mi VDOT?',
        answer:
          'Una carrera reciente, llana y a tope, entre 5K y media maratón. Los esfuerzos más cortos dependen de la capacidad anaeróbica, y el maratón de la alimentación y el calor, así que ambos distorsionan la estimación. Actualízalo tras cada buena carrera o cada par de meses.',
      },
    ],
    it: [
      {
        question: 'Il VDOT è uguale al VO2max?',
        answer:
          'No. Il VO2max si misura in laboratorio dall’ossigeno consumato. Il VDOT si ricava a ritroso da un tempo di gara e incorpora la tua economia di corsa e la quota del massimo che riesci a sostenere. Due runner con lo stesso VO2max possono avere VDOT molto diversi.',
      },
      {
        question: 'Qual è un buon VDOT?',
        answer:
          'Dipende da età, sesso ed esperienza. Come riferimento, un 10 km in 50:00 dà un VDOT di circa 40, un 10 km in 45:00 circa 45 e un 10 km in 40:00 circa 52. I migliori fondisti del mondo stanno oltre 80.',
      },
      {
        question: 'Quale gara usare per calcolare il VDOT?',
        answer:
          'Una gara recente, piatta e corsa a tutta, tra i 5 km e la mezza maratona. Gli sforzi più brevi dipendono dalla capacità anaerobica e la maratona da alimentazione e caldo, quindi entrambi falsano la stima. Aggiornalo dopo ogni buona gara o ogni due mesi circa.',
      },
    ],
    'pt-br': [
      {
        question: 'VDOT é a mesma coisa que VO2máx?',
        answer:
          'Não. O VO2máx é medido em laboratório pelo oxigênio que você consome. O VDOT é calculado de trás para frente a partir de um tempo de prova e inclui a sua economia de corrida e a fração do máximo que você consegue sustentar. Dois corredores com o mesmo VO2máx podem ter VDOTs bem diferentes.',
      },
      {
        question: 'Qual é um bom VDOT?',
        answer:
          'Depende de idade, sexo e experiência. Como referência, 10 km em 50:00 dá um VDOT de cerca de 40, 10 km em 45:00 cerca de 45 e 10 km em 40:00 cerca de 52. Os melhores fundistas do mundo ficam acima de 80.',
      },
      {
        question: 'Qual prova usar para calcular o VDOT?',
        answer:
          'Uma prova recente, plana e corrida no máximo, entre 5 km e meia maratona. Esforços mais curtos dependem da capacidade anaeróbia, e a maratona da hidratação, da alimentação e do calor, então os dois distorcem a estimativa. Atualize depois de cada boa prova ou a cada dois meses.',
      },
    ],
    de: [
      {
        question: 'Ist VDOT dasselbe wie VO2max?',
        answer:
          'Nein. Die VO2max wird im Labor über den Sauerstoffverbrauch gemessen. Der VDOT wird aus einer Wettkampfzeit zurückgerechnet und bezieht deine Laufökonomie ein und wie gut du einen Anteil deines Maximums halten kannst. Zwei Läufer mit derselben VO2max können sehr unterschiedliche VDOT-Werte haben.',
      },
      {
        question: 'Was ist ein guter VDOT?',
        answer:
          'Das hängt von Alter, Geschlecht und Erfahrung ab. Zur Orientierung: 10 km in 50:00 ergeben einen VDOT von etwa 40, 10 km in 45:00 etwa 45 und 10 km in 40:00 etwa 52. Langstreckenläufer der Weltklasse liegen bei über 80.',
      },
      {
        question:
          'Welchen Wettkampf sollte ich für die Berechnung meines VDOT nehmen?',
        answer:
          'Einen aktuellen, flachen Wettkampf zwischen 5 km und Halbmarathon, in dem du alles gegeben hast. Kürzere Belastungen hängen stark von der anaeroben Kapazität ab, und ein Marathon von Verpflegung und Hitze, beides verzerrt die Schätzung. Aktualisiere ihn nach jedem guten Wettkampf oder alle paar Monate.',
      },
    ],
  },
  related: ['vo2max', 'vma', 'trimp', 'taper'],
  links: ['/pace-charts', '/tools/race-predictor', '/tools/vma'],
  sources: [
    {
      citation:
        'Daniels J, Gilbert J (1979). Oxygen Power: Performance Tables for Distance Runners. Tempe, Arizona: self-published.',
    },
    {
      citation:
        'Daniels J (2014). Daniels’ Running Formula, 3rd edition. Champaign, Illinois: Human Kinetics.',
    },
    {
      citation:
        'Joyner MJ, Coyle EF (2008). Endurance exercise performance: the physiology of champions. The Journal of Physiology 586(1): 35–44.',
      url: 'https://doi.org/10.1113/jphysiol.2007.143834',
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

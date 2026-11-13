import type { LearnTerm } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const vo2max: LearnTerm = {
  slug: 'vo2max',
  theme: 'intensity',
  name: {
    en: 'VO2max',
    fr: 'VO2max',
    es: 'VO2max',
    it: 'VO2max',
    'pt-br': 'VO2máx',
    de: 'VO2max',
  },
  title: {
    en: 'VO2max: definition, formula, example',
    fr: 'Qu’est-ce que la VO2max\u00a0? Définition, formule, exemple',
    es: '¿Qué es el VO2max? Definición, fórmula y ejemplo',
    it: 'Cos’è il VO2max? Definizione, formula, esempio',
    'pt-br': 'O que é VO2máx? Definição, fórmula e exemplo',
    de: 'VO2max: Definition, Formel, Beispiel',
  },
  description: {
    en: 'VO2max is the most oxygen your body can use per minute. How it is measured in a lab, estimated with the Cooper test or a watch, and how it relates to VMA.',
    fr: 'La VO2max est le débit maximal d’oxygène que votre corps peut utiliser. Mesure en labo, estimation par le test de Cooper ou la montre, lien avec la VMA.',
    es: 'El VO2max es el máximo oxígeno que tu cuerpo usa por minuto: medición en laboratorio, estimación con el test de Cooper o el reloj, y relación con la VAM.',
    it: 'Il VO2max è il massimo ossigeno che il corpo usa al minuto: misura in laboratorio, stima con il test di Cooper o l’orologio, e legame con la VAM.',
    'pt-br':
      'O VO2máx é o máximo de oxigênio que o corpo usa por minuto. Como medir em laboratório, estimar com o teste de Cooper ou o relógio, e a relação com a VAM.',
    de: 'VO2max ist die maximale Sauerstoffmenge, die dein Körper pro Minute nutzen kann. Messung im Labor, Schätzung per Cooper-Test oder Uhr und Bezug zur VMA.',
  },
  definition: {
    en: 'VO2max is the maximum rate at which your body can take up and use oxygen during exercise, usually expressed in millilitres per kilogram of body weight per minute (ml/kg/min).',
    fr: 'La VO2max est le débit maximal d’oxygène que votre organisme peut prélever et utiliser pendant l’effort, exprimé le plus souvent en millilitres par kilogramme de poids corporel et par minute (ml/kg/min).',
    es: 'El VO2max es la cantidad máxima de oxígeno que tu cuerpo puede captar y utilizar por minuto durante el ejercicio, expresada normalmente en mililitros por kilo de peso corporal y por minuto (ml/kg/min).',
    it: 'Il VO2max è la quantità massima di ossigeno che il corpo riesce a prelevare e utilizzare al minuto durante l’esercizio, espressa di solito in millilitri per chilo di peso corporeo al minuto (ml/kg/min).',
    'pt-br':
      'O VO2máx é a quantidade máxima de oxigênio que o corpo consegue captar e usar por minuto durante o exercício, geralmente expressa em mililitros por quilo de peso corporal por minuto (ml/kg/min).',
    de: 'Die VO2max (maximale Sauerstoffaufnahme) ist die höchste Rate, mit der dein Körper bei Belastung Sauerstoff aufnehmen und verwerten kann, meist angegeben in Millilitern pro Kilogramm Körpergewicht und Minute (ml/kg/min).',
  },
  aliases: {
    en: ['Maximal oxygen uptake', 'VO2 max', 'Aerobic capacity'],
    fr: [
      'Consommation maximale d’oxygène',
      'VO2 max',
      'Puissance maximale aérobie',
    ],
    es: ['Consumo máximo de oxígeno', 'VO2 máx'],
    it: ['Massimo consumo di ossigeno', 'VO2 max'],
    'pt-br': ['Consumo máximo de oxigênio', 'VO2max', 'VO2 máx'],
    de: ['Maximale Sauerstoffaufnahme', 'VO2 max', 'Aerobe Kapazität'],
  },
  faq: {
    en: [
      {
        question: 'What is a good VO2max for a runner?',
        answer:
          'Untrained adults often measure 30 to 45 ml/kg/min, trained recreational runners 50 to 60, and elite men distance runners 70 to 85, elite women somewhat lower. Above a certain level, running economy and the share of VO2max you can sustain separate runners more than VO2max itself.',
      },
      {
        question: 'Is my watch’s VO2max accurate?',
        answer:
          'Watches estimate VO2max from the relationship between your heart rate and your speed or power, using models their makers do not fully publish. They are useful for spotting a trend over weeks, less for an absolute value: heat, hills and a wrong maximum heart rate shift the estimate.',
      },
      {
        question: 'Can you increase VO2max?',
        answer:
          'Yes, especially in the first years of training. Intervals of 3 to 5 minutes near VMA and a large volume of easy running both raise it. Gains slow down as you get fitter, and genetics set a large part of the ceiling.',
      },
    ],
    fr: [
      {
        question: 'Qu’est-ce qu’une bonne VO2max pour un coureur\u00a0?',
        answer:
          'Les adultes non entraînés mesurent souvent 30 à 45\u00a0ml/kg/min, les coureurs loisirs entraînés 50 à 60, et les meilleurs coureurs de fond 70 à 85 chez les hommes, un peu moins chez les femmes. Au-delà d’un certain niveau, l’économie de course et la part de VO2max que vous pouvez tenir départagent davantage les coureurs que la VO2max elle-même.',
      },
      {
        question: 'La VO2max affichée par ma montre est-elle fiable\u00a0?',
        answer:
          'Les montres estiment la VO2max à partir du rapport entre votre fréquence cardiaque et votre vitesse ou votre puissance, avec des modèles que les fabricants ne publient pas en détail. Elles servent à suivre une tendance sur plusieurs semaines, moins à donner une valeur absolue\u00a0: chaleur, dénivelé et FCmax erronée faussent l’estimation.',
      },
      {
        question: 'Peut-on augmenter sa VO2max\u00a0?',
        answer:
          'Oui, surtout pendant les premières années d’entraînement. Les fractions de 3 à 5 minutes proches de la VMA et un gros volume d’endurance fondamentale la font progresser. Les gains ralentissent avec le niveau, et la génétique fixe une bonne part du plafond.',
      },
    ],
    es: [
      {
        question: '¿Qué es un buen VO2max para un corredor?',
        answer:
          'Los adultos sin entrenar suelen medir entre 30 y 45 ml/kg/min, los corredores populares entrenados entre 50 y 60, y los fondistas de élite entre 70 y 85 en hombres, algo menos en mujeres. A partir de cierto nivel, la economía de carrera y la fracción de VO2max que puedes sostener separan más a los corredores que el propio VO2max.',
      },
      {
        question: '¿Es fiable el VO2max de mi reloj?',
        answer:
          'Los relojes lo estiman a partir de la relación entre tu pulso y tu velocidad o potencia, con modelos que los fabricantes no publican del todo. Sirven para ver una tendencia a lo largo de semanas, menos como valor absoluto: el calor, las cuestas y una frecuencia máxima mal configurada desvían la estimación.',
      },
      {
        question: '¿Se puede aumentar el VO2max?',
        answer:
          'Sí, sobre todo en los primeros años de entrenamiento. Las series de 3 a 5 minutos cerca de la VAM y mucho volumen de rodaje suave lo hacen subir. Las mejoras se frenan con el nivel, y la genética marca buena parte del techo.',
      },
    ],
    it: [
      {
        question: 'Qual è un buon VO2max per un runner?',
        answer:
          'Gli adulti non allenati misurano spesso 30–45 ml/kg/min, gli amatori allenati 50–60, i fondisti d’élite 70–85 tra gli uomini, un po’ meno tra le donne. Oltre un certo livello, l’economia di corsa e la quota di VO2max che riesci a sostenere distinguono i corridori più del VO2max stesso.',
      },
      {
        question: 'Il VO2max del mio orologio è affidabile?',
        answer:
          'Gli orologi lo stimano dal rapporto tra frequenza cardiaca e velocità o potenza, con modelli che i produttori non pubblicano per intero. Servono a seguire una tendenza nell’arco di settimane, meno come valore assoluto: caldo, salite e una frequenza massima sbagliata spostano la stima.',
      },
      {
        question: 'Si può aumentare il VO2max?',
        answer:
          'Sì, soprattutto nei primi anni di allenamento. Ripetute da 3 a 5 minuti vicino alla VAM e un grande volume di corsa lenta lo fanno salire. I miglioramenti rallentano con il livello, e la genetica fissa buona parte del tetto.',
      },
    ],
    'pt-br': [
      {
        question: 'Qual é um bom VO2máx para um corredor?',
        answer:
          'Adultos destreinados costumam medir de 30 a 45 ml/kg/min, corredores amadores treinados de 50 a 60, e fundistas de elite de 70 a 85 entre os homens, um pouco menos entre as mulheres. A partir de certo nível, a economia de corrida e a fração do VO2máx que você sustenta separam mais os corredores do que o próprio VO2máx.',
      },
      {
        question: 'O VO2máx do meu relógio é confiável?',
        answer:
          'Os relógios estimam o VO2máx pela relação entre a frequência cardíaca e a velocidade ou a potência, com modelos que os fabricantes não publicam por completo. Servem para acompanhar a tendência ao longo de semanas, menos como valor absoluto: calor, subidas e uma frequência máxima errada distorcem a estimativa.',
      },
      {
        question: 'Dá para aumentar o VO2máx?',
        answer:
          'Sim, sobretudo nos primeiros anos de treino. Tiros de 3 a 5 minutos perto da VAM e muito volume de rodagem leve fazem ele subir. Os ganhos diminuem com o nível, e a genética define boa parte do teto.',
      },
    ],
    de: [
      {
        question: 'Was ist eine gute VO2max für Läufer?',
        answer:
          'Untrainierte Erwachsene liegen oft bei 30 bis 45 ml/kg/min, trainierte Hobbyläufer bei 50 bis 60 und männliche Elite-Langstreckenläufer bei 70 bis 85, Elite-Läuferinnen etwas darunter. Ab einem gewissen Niveau unterscheiden Laufökonomie und der haltbare Anteil der VO2max Läufer stärker als die VO2max selbst.',
      },
      {
        question: 'Wie genau ist die VO2max meiner Uhr?',
        answer:
          'Sportuhren schätzen die VO2max aus dem Verhältnis zwischen deiner Herzfrequenz und deiner Geschwindigkeit oder Leistung, mit Modellen, die die Hersteller nicht vollständig veröffentlichen. Sie sind nützlich, um einen Trend über Wochen zu erkennen, weniger für einen absoluten Wert: Hitze, Hügel und eine falsche HFmax verschieben die Schätzung.',
      },
      {
        question: 'Kann man die VO2max steigern?',
        answer:
          'Ja, besonders in den ersten Trainingsjahren. Intervalle von 3 bis 5 Minuten nahe der VMA und viel lockerer Umfang erhöhen sie beide. Mit wachsender Fitness werden die Zuwächse kleiner, und die Genetik bestimmt einen großen Teil der Obergrenze.',
      },
    ],
  },
  related: ['vma', 'vdot', 'hrv', 'aerobic-decoupling'],
  links: ['/tools/vma', '/tools/race-predictor', '/tools/heart-rate-zones'],
  sources: [
    {
      citation:
        'Bassett DR, Howley ET (2000). Limiting factors for maximum oxygen uptake and determinants of endurance performance. Medicine & Science in Sports & Exercise 32(1): 70–84.',
      url: 'https://doi.org/10.1097/00005768-200001000-00012',
    },
    {
      citation:
        'Joyner MJ, Coyle EF (2008). Endurance exercise performance: the physiology of champions. The Journal of Physiology 586(1): 35–44.',
      url: 'https://doi.org/10.1113/jphysiol.2007.143834',
    },
    {
      citation:
        'Cooper KH (1968). A means of assessing maximal oxygen intake. JAMA 203(3): 201–204.',
      url: 'https://doi.org/10.1001/jama.1968.03140030033008',
    },
    {
      citation:
        'Uth N, Sørensen H, Overgaard K, Pedersen PK (2004). Estimation of VO2max from the ratio between HRmax and HRrest: the Heart Rate Ratio Method. European Journal of Applied Physiology 91(1): 111–115.',
      url: 'https://doi.org/10.1007/s00421-003-0988-y',
    },
    {
      citation:
        'Léger L, Mercier D (1984). Gross energy cost of horizontal treadmill and track running. Sports Medicine 1(4): 270–277.',
      url: 'https://doi.org/10.2165/00007256-198401040-00003',
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

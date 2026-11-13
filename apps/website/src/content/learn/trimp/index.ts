import type { LearnTerm } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const trimp: LearnTerm = {
  slug: 'trimp',
  theme: 'load',
  name: {
    en: 'TRIMP',
    fr: 'TRIMP',
    es: 'TRIMP',
    it: 'TRIMP',
    'pt-br': 'TRIMP',
    de: 'TRIMP',
  },
  title: {
    en: 'TRIMP: definition, formula, example',
    fr: 'Qu’est-ce que le TRIMP ? Définition, formule, exemple',
    es: '¿Qué es el TRIMP? Definición, fórmula y ejemplo',
    it: 'Cos’è il TRIMP? Definizione, formula, esempio',
    'pt-br': 'O que é TRIMP? Definição, fórmula e exemplo',
    de: 'Was ist TRIMP? Definition, Formel, Beispiel',
  },
  description: {
    en: 'TRIMP (training impulse) puts one number on a session from duration and heart rate. Banister’s formula, the 0.64/1.92 coefficients and a worked example.',
    fr: 'Le TRIMP (training impulse) chiffre une séance à partir de sa durée et de la fréquence cardiaque. Formule de Banister, coefficients et exemple calculé.',
    es: 'El TRIMP (training impulse) resume una sesión en un número a partir de la duración y el pulso. Fórmula de Banister, coeficientes y ejemplo resuelto.',
    it: 'Il TRIMP (training impulse) riassume una seduta in un numero partendo da durata e frequenza cardiaca. Formula di Banister, coefficienti ed esempio.',
    'pt-br':
      'O TRIMP (training impulse) resume uma sessão em um número a partir da duração e da frequência cardíaca. Fórmula de Banister, coeficientes e exemplo.',
    de: 'Der TRIMP (Trainingsimpuls) fasst eine Einheit aus Dauer und Herzfrequenz in einer Zahl zusammen. Banisters Formel, Koeffizienten und ein Rechenbeispiel.',
  },
  definition: {
    en: 'TRIMP (training impulse) is a training load score that multiplies the duration of a session by its heart rate intensity, weighted exponentially so that hard minutes count more than easy ones.',
    fr: 'Le TRIMP (training impulse) est un score de charge d’entraînement qui multiplie la durée d’une séance par son intensité cardiaque, pondérée de façon exponentielle pour que les minutes difficiles comptent davantage que les minutes faciles.',
    es: 'El TRIMP (training impulse) es una puntuación de carga de entrenamiento que multiplica la duración de una sesión por su intensidad cardíaca, ponderada de forma exponencial para que los minutos duros cuenten más que los suaves.',
    it: 'Il TRIMP (training impulse) è un punteggio di carico di allenamento che moltiplica la durata di una seduta per la sua intensità cardiaca, pesata in modo esponenziale perché i minuti duri contino più di quelli facili.',
    'pt-br':
      'O TRIMP (training impulse) é uma pontuação de carga de treino que multiplica a duração de uma sessão pela intensidade cardíaca, com peso exponencial para que os minutos fortes contem mais que os leves.',
    de: 'Der TRIMP (training impulse, Trainingsimpuls) ist ein Wert für die Trainingsbelastung, der die Dauer einer Einheit mit ihrer Herzfrequenzintensität multipliziert, exponentiell gewichtet, sodass harte Minuten mehr zählen als lockere.',
  },
  aliases: {
    en: ['Training impulse', 'Banister TRIMP'],
    fr: ['Training impulse', 'Impulsion d’entraînement', 'TRIMP de Banister'],
    es: ['Training impulse', 'Impulso de entrenamiento', 'TRIMP de Banister'],
    it: ['Training impulse', 'Impulso di allenamento', 'TRIMP di Banister'],
    'pt-br': ['Training impulse', 'Impulso de treino', 'TRIMP de Banister'],
    de: ['Training impulse', 'Trainingsimpuls', 'Banister-TRIMP'],
  },
  faq: {
    en: [
      {
        question: 'What is a good TRIMP score?',
        answer:
          'There is no good or bad score on its own. An easy hour usually lands between 60 and 90, a hard interval session or a long run well above 100. What matters is how your weekly total and your fitness (CTL) evolve compared with your own history.',
      },
      {
        question: 'Why do men and women have different TRIMP coefficients?',
        answer:
          'Banister fitted the weighting to how blood lactate rises with heart rate, and the average curve differed between the men and women measured: 0.64 and 1.92 for men, 0.86 and 1.67 for women. They describe group averages, not any one athlete.',
      },
      {
        question: 'Can TRIMP be calculated without a heart rate monitor?',
        answer:
          'No: TRIMP needs heart rate, plus your resting and maximum heart rate. Without them, use session RPE (effort from 0 to 10 multiplied by minutes), which measures the same thing from a different angle.',
      },
    ],
    fr: [
      {
        question: 'Qu’est-ce qu’un bon score de TRIMP ?',
        answer:
          'Un score n’est ni bon ni mauvais en soi. Une heure d’endurance fondamentale tourne souvent entre 60 et 90, une séance de fractionné ou une sortie longue dépasse largement 100. Ce qui compte, c’est l’évolution de votre total hebdomadaire et de votre forme (CTL) par rapport à votre propre historique.',
      },
      {
        question:
          'Pourquoi les coefficients du TRIMP diffèrent-ils entre hommes et femmes ?',
        answer:
          'Banister a calé la pondération sur la montée de la lactatémie avec la fréquence cardiaque, et la courbe moyenne différait entre les hommes et les femmes mesurés : 0,64 et 1,92 pour les hommes, 0,86 et 1,67 pour les femmes. Ce sont des moyennes de groupe, pas des valeurs individuelles.',
      },
      {
        question: 'Peut-on calculer le TRIMP sans cardiofréquencemètre ?',
        answer:
          'Non : le TRIMP exige la fréquence cardiaque, ainsi que vos fréquences de repos et maximale. Sans elles, utilisez la RPE de séance (effort de 0 à 10 multiplié par les minutes), qui mesure la même chose sous un autre angle.',
      },
    ],
    es: [
      {
        question: '¿Qué es un buen valor de TRIMP?',
        answer:
          'Ningún valor es bueno o malo por sí solo. Una hora suave suele quedar entre 60 y 90, y una sesión de series o una tirada larga supera con holgura los 100. Lo que importa es cómo evolucionan tu total semanal y tu forma física (CTL) frente a tu propio historial.',
      },
      {
        question:
          '¿Por qué hombres y mujeres tienen coeficientes de TRIMP distintos?',
        answer:
          'Banister ajustó la ponderación a cómo sube el lactato en sangre con el pulso, y la curva media era distinta entre los hombres y las mujeres medidos: 0,64 y 1,92 para ellos, 0,86 y 1,67 para ellas. Son promedios de grupo, no valores individuales.',
      },
      {
        question: '¿Se puede calcular el TRIMP sin pulsómetro?',
        answer:
          'No: el TRIMP necesita la frecuencia cardíaca, además de tu pulso en reposo y máximo. Sin ellos, usa el RPE de sesión (esfuerzo de 0 a 10 multiplicado por los minutos), que mide lo mismo desde otro ángulo.',
      },
    ],
    it: [
      {
        question: 'Qual è un buon valore di TRIMP?',
        answer:
          'Nessun valore è buono o cattivo di per sé. Un’ora facile di solito sta tra 60 e 90, una seduta di ripetute o un lungo supera ampiamente 100. Conta come evolvono il tuo totale settimanale e la tua forma (CTL) rispetto alla tua storia.',
      },
      {
        question: 'Perché uomini e donne hanno coefficienti di TRIMP diversi?',
        answer:
          'Banister ha tarato la pesatura su come sale il lattato nel sangue con la frequenza cardiaca, e la curva media era diversa tra gli uomini e le donne misurati: 0,64 e 1,92 per gli uomini, 0,86 e 1,67 per le donne. Sono medie di gruppo, non valori individuali.',
      },
      {
        question: 'Si può calcolare il TRIMP senza cardiofrequenzimetro?',
        answer:
          'No: il TRIMP richiede la frequenza cardiaca, oltre alla frequenza a riposo e massima. Senza, usa l’RPE di seduta (sforzo da 0 a 10 moltiplicato per i minuti), che misura la stessa cosa da un’altra angolazione.',
      },
    ],
    'pt-br': [
      {
        question: 'Qual é um bom valor de TRIMP?',
        answer:
          'Nenhum valor é bom ou ruim sozinho. Uma hora leve costuma ficar entre 60 e 90, e um treino de tiros ou um longão passa bem de 100. O que importa é como o seu total semanal e o seu condicionamento (CTL) evoluem em relação ao seu próprio histórico.',
      },
      {
        question:
          'Por que homens e mulheres têm coeficientes de TRIMP diferentes?',
        answer:
          'Banister ajustou o peso à forma como o lactato sobe com a frequência cardíaca, e a curva média era diferente entre os homens e as mulheres medidos: 0,64 e 1,92 para eles, 0,86 e 1,67 para elas. São médias de grupo, não valores individuais.',
      },
      {
        question: 'Dá para calcular o TRIMP sem monitor cardíaco?',
        answer:
          'Não: o TRIMP precisa da frequência cardíaca, além da frequência de repouso e da máxima. Sem elas, use a PSE da sessão (esforço de 0 a 10 vezes os minutos), que mede a mesma coisa por outro ângulo.',
      },
    ],
    de: [
      {
        question: 'Was ist ein guter TRIMP-Wert?',
        answer:
          'Für sich genommen gibt es keinen guten oder schlechten Wert. Eine lockere Stunde liegt meist zwischen 60 und 90, eine harte Intervalleinheit oder ein langer Lauf deutlich über 100. Entscheidend ist, wie sich deine Wochensumme und deine Fitness (CTL) im Vergleich zu deiner eigenen Historie entwickeln.',
      },
      {
        question:
          'Warum haben Männer und Frauen unterschiedliche TRIMP-Koeffizienten?',
        answer:
          'Banister passte die Gewichtung daran an, wie das Blutlaktat mit der Herzfrequenz ansteigt, und die mittlere Kurve unterschied sich zwischen den gemessenen Männern und Frauen: 0,64 und 1,92 für Männer, 0,86 und 1,67 für Frauen. Sie beschreiben Gruppenmittelwerte, nicht einen einzelnen Athleten.',
      },
      {
        question: 'Lässt sich der TRIMP ohne Herzfrequenzmesser berechnen?',
        answer:
          'Nein: Der TRIMP braucht die Herzfrequenz sowie deinen Ruhepuls und deine HFmax. Ohne sie nutzt du die Session-RPE (Anstrengung von 0 bis 10 multipliziert mit den Minuten), die dasselbe aus einem anderen Blickwinkel misst.',
      },
    ],
  },
  related: ['ctl-atl-tsb', 'session-rpe', 'aerobic-decoupling', 'hrv'],
  links: [
    '/features/training-load',
    '/tools/heart-rate-zones',
    '/blog/what-is-trimp-and-how-to-use-it',
    '/blog/rpe-vs-heart-rate-why-your-heart-doesnt-tell-the-whole-story',
  ],
  sources: [
    {
      citation:
        'Banister EW, Calvert TW, Savage MV, Bach T (1975). A systems model of training for athletic performance. Australian Journal of Sports Medicine 7: 57–61.',
    },
    {
      citation:
        'Morton RH, Fitz-Clarke JR, Banister EW (1990). Modeling human performance in running. Journal of Applied Physiology 69(3): 1171–1177.',
      url: 'https://doi.org/10.1152/jappl.1990.69.3.1171',
    },
    {
      citation:
        'Foster C, Florhaug JA, Franklin J, et al. (2001). A new approach to monitoring exercise training. Journal of Strength and Conditioning Research 15(1): 109–115.',
      url: 'https://doi.org/10.1519/00124278-200102000-00019',
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

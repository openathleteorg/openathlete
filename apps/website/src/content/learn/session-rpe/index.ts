import type { LearnTerm } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const sessionRpe: LearnTerm = {
  slug: 'session-rpe',
  theme: 'load',
  name: {
    en: 'Session RPE',
    fr: 'RPE de séance',
    es: 'RPE de sesión',
    it: 'RPE di seduta',
    'pt-br': 'PSE da sessão',
    de: 'Session-RPE',
  },
  title: {
    en: 'Session RPE: definition, formula, example',
    fr: 'Qu’est-ce que la RPE de séance\u00a0? Définition, formule, exemple',
    es: '¿Qué es el RPE de sesión? Definición, fórmula y ejemplo',
    it: 'Cos’è l’RPE di seduta? Definizione, formula, esempio',
    'pt-br': 'O que é a PSE da sessão? Definição, fórmula e exemplo',
    de: 'Was ist die Session-RPE? Definition, Formel, Beispiel',
  },
  description: {
    en: 'Session RPE (Foster’s sRPE) measures training load as effort from 0 to 10 times minutes. The formula, a worked week, monotony and strain, and its limits.',
    fr: 'La RPE de séance (sRPE de Foster) mesure la charge par l’effort perçu de 0 à 10 multiplié par les minutes. Formule, semaine type, monotonie et limites.',
    es: 'El RPE de sesión (sRPE de Foster) mide la carga como esfuerzo de 0 a 10 por minutos. La fórmula, una semana de ejemplo, la monotonía y sus límites.',
    it: 'L’RPE di seduta (sRPE di Foster) misura il carico come sforzo da 0 a 10 per i minuti. La formula, una settimana d’esempio, la monotonia e i limiti.',
    'pt-br':
      'A PSE da sessão (sRPE de Foster) mede a carga como esforço de 0 a 10 vezes os minutos. A fórmula, uma semana de exemplo, a monotonia e os limites.',
    de: 'Die Session-RPE (sRPE nach Foster) misst die Belastung als Anstrengung von 0 bis 10 mal Minuten. Formel, Beispielwoche, Monotonie, Strain und Grenzen.',
  },
  definition: {
    en: 'Session RPE is a training load measure that multiplies how hard the whole session felt, rated from 0 to 10, by its duration in minutes.',
    fr: 'La RPE de séance est une mesure de charge d’entraînement qui multiplie la difficulté perçue de la séance entière, notée de 0 à 10, par sa durée en minutes.',
    es: 'El RPE de sesión es una medida de carga de entrenamiento que multiplica lo dura que se sintió la sesión entera, puntuada de 0 a 10, por su duración en minutos.',
    it: 'L’RPE di seduta è una misura del carico di allenamento che moltiplica quanto è stata percepita dura l’intera seduta, con un voto da 0 a 10, per la sua durata in minuti.',
    'pt-br':
      'A PSE da sessão é uma medida de carga de treino que multiplica o quanto a sessão inteira pareceu dura, numa nota de 0 a 10, pela duração em minutos.',
    de: 'Die Session-RPE ist eine Messgröße für Trainingsbelastung, die multipliziert, wie hart sich die gesamte Einheit angefühlt hat (bewertet von 0 bis 10), mit ihrer Dauer in Minuten.',
  },
  aliases: {
    en: ['sRPE', 'Foster method', 'Session rating of perceived exertion'],
    fr: ['sRPE', 'Méthode de Foster', 'Effort perçu de séance'],
    es: ['sRPE', 'Método de Foster', 'Esfuerzo percibido de la sesión'],
    it: ['sRPE', 'Metodo di Foster', 'Sforzo percepito di seduta'],
    'pt-br': ['sRPE', 'RPE da sessão', 'Método de Foster'],
    de: ['sRPE', 'Foster-Methode', 'Empfundene Anstrengung der Einheit'],
  },
  faq: {
    en: [
      {
        question: 'When should I rate session RPE?',
        answer:
          'Foster’s protocol asks for the rating about 30 minutes after the session, so the last effort does not dominate. Rating it later the same day also works, as long as you always rate the whole session and do it the same way.',
      },
      {
        question: 'Is session RPE as good as heart rate?',
        answer:
          'For total load, studies generally find it agrees well with heart-rate methods, and it also covers strength work, sprints and downhill running that heart rate misses. It is subjective, so the best use is next to an objective measure such as TRIMP.',
      },
      {
        question: 'What is a high session RPE load?',
        answer:
          'There is no absolute threshold: the units are arbitrary and depend on how you rate. Compare each week with your own recent weeks; a sudden rise of 30% or more is worth noticing.',
      },
    ],
    fr: [
      {
        question: 'Quand noter la RPE de séance\u00a0?',
        answer:
          'Le protocole de Foster demande la note environ 30 minutes après la séance, pour que le dernier effort ne domine pas. La noter plus tard dans la journée fonctionne aussi, à condition de toujours noter la séance entière, de la même manière.',
      },
      {
        question: 'La RPE de séance vaut-elle la fréquence cardiaque\u00a0?',
        answer:
          'Pour la charge totale, les études la trouvent en général bien corrélée aux méthodes cardiaques, et elle couvre aussi le renforcement, les sprints et la descente que le cardio rate. Elle reste subjective\u00a0: le mieux est de la lire à côté d’une mesure objective comme le TRIMP.',
      },
      {
        question: 'À partir de quand une charge en RPE est-elle élevée\u00a0?',
        answer:
          'Il n’y a pas de seuil absolu\u00a0: les unités sont arbitraires et dépendent de votre façon de noter. Comparez chaque semaine à vos semaines récentes\u00a0; une hausse soudaine de 30\u00a0% ou plus mérite attention.',
      },
    ],
    es: [
      {
        question: '¿Cuándo hay que puntuar el RPE de sesión?',
        answer:
          'El protocolo de Foster pide la puntuación unos 30 minutos después de la sesión, para que el último esfuerzo no domine. Puntuarla más tarde ese mismo día también sirve, siempre que valores la sesión entera y lo hagas siempre igual.',
      },
      {
        question: '¿El RPE de sesión es tan bueno como el pulso?',
        answer:
          'Para la carga total, los estudios suelen encontrar una buena concordancia con los métodos de pulso, y además recoge la fuerza, los sprints y las bajadas que el pulso no ve. Es subjetivo, así que lo mejor es usarlo junto a una medida objetiva como el TRIMP.',
      },
      {
        question: '¿Qué es una carga de RPE alta?',
        answer:
          'No hay un umbral absoluto: las unidades son arbitrarias y dependen de cómo puntúas. Compara cada semana con tus semanas recientes; una subida brusca del 30 % o más merece atención.',
      },
    ],
    it: [
      {
        question: 'Quando dare il voto RPE alla seduta?',
        answer:
          'Il protocollo di Foster chiede il voto circa 30 minuti dopo la seduta, perché l’ultimo sforzo non domini. Darlo più tardi nello stesso giorno va bene, purché valuti sempre l’intera seduta e sempre allo stesso modo.',
      },
      {
        question: 'L’RPE di seduta vale quanto la frequenza cardiaca?',
        answer:
          'Per il carico totale, gli studi trovano in genere un buon accordo con i metodi cardiaci, e in più copre forza, sprint e discese che il cardio non vede. Resta soggettivo, quindi conviene usarlo accanto a una misura oggettiva come il TRIMP.',
      },
      {
        question: 'Quando un carico RPE è alto?',
        answer:
          'Non c’è una soglia assoluta: le unità sono arbitrarie e dipendono da come dai i voti. Confronta ogni settimana con le tue settimane recenti; un aumento improvviso del 30% o più merita attenzione.',
      },
    ],
    'pt-br': [
      {
        question: 'Quando dar a nota de PSE da sessão?',
        answer:
          'O protocolo de Foster pede a nota cerca de 30 minutos depois da sessão, para que o último esforço não domine. Dar a nota mais tarde no mesmo dia também funciona, desde que você avalie sempre a sessão inteira e do mesmo jeito.',
      },
      {
        question: 'A PSE da sessão é tão boa quanto a frequência cardíaca?',
        answer:
          'Para a carga total, os estudos costumam encontrar boa concordância com os métodos por frequência cardíaca, e ela ainda cobre musculação, tiros curtos e descidas que o cardio não vê. É subjetiva, então o melhor é usá-la ao lado de uma medida objetiva como o TRIMP.',
      },
      {
        question: 'O que é uma carga de PSE alta?',
        answer:
          'Não existe limite absoluto: as unidades são arbitrárias e dependem de como você dá as notas. Compare cada semana com as suas semanas recentes; uma alta repentina de 30% ou mais merece atenção.',
      },
    ],
    de: [
      {
        question: 'Wann sollte ich die Session-RPE bewerten?',
        answer:
          'Fosters Protokoll verlangt die Bewertung etwa 30 Minuten nach der Einheit, damit die letzte Belastung nicht dominiert. Eine spätere Bewertung am selben Tag funktioniert ebenfalls, solange du immer die gesamte Einheit bewertest und es immer gleich machst.',
      },
      {
        question: 'Ist die Session-RPE so gut wie die Herzfrequenz?',
        answer:
          'Für die Gesamtbelastung stimmt sie laut Studien meist gut mit herzfrequenzbasierten Methoden überein, und sie erfasst auch Krafttraining, Sprints und Bergablaufen, die die Herzfrequenz übersieht. Sie ist subjektiv, am besten nutzt du sie daher neben einer objektiven Messgröße wie dem TRIMP.',
      },
      {
        question: 'Was ist eine hohe Session-RPE-Belastung?',
        answer:
          'Es gibt keine absolute Schwelle: Die Einheiten sind willkürlich und hängen davon ab, wie du bewertest. Vergleiche jede Woche mit deinen eigenen letzten Wochen; ein plötzlicher Anstieg um 30 % oder mehr verdient Aufmerksamkeit.',
      },
    ],
  },
  related: ['trimp', 'ctl-atl-tsb', 'hrv'],
  links: [
    '/features/training-load',
    '/blog/rpe-vs-heart-rate-why-your-heart-doesnt-tell-the-whole-story',
    '/blog/what-is-trimp-and-how-to-use-it',
    '/blog/5-signs-of-overtraining-and-how-to-avoid-it',
  ],
  sources: [
    {
      citation:
        'Foster C (1998). Monitoring training in athletes with reference to overtraining syndrome. Medicine & Science in Sports & Exercise 30(7): 1164–1168.',
      url: 'https://doi.org/10.1097/00005768-199807000-00023',
    },
    {
      citation:
        'Foster C, Florhaug JA, Franklin J, et al. (2001). A new approach to monitoring exercise training. Journal of Strength and Conditioning Research 15(1): 109–115.',
      url: 'https://doi.org/10.1519/00124278-200102000-00019',
    },
    {
      citation:
        'Borg GA (1982). Psychophysical bases of perceived exertion. Medicine & Science in Sports & Exercise 14(5): 377–381.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/7154893/',
    },
    {
      citation:
        'Haddad M, Stylianides G, Djaoui L, Dellal A, Chamari K (2017). Session-RPE method for training load monitoring: validity, ecological usefulness, and influencing factors. Frontiers in Neuroscience 11: 612.',
      url: 'https://doi.org/10.3389/fnins.2017.00612',
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

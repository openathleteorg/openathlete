import type { LearnTerm } from '../types';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const polarizedTraining: LearnTerm = {
  slug: 'polarized-training',
  theme: 'intensity',
  name: {
    en: 'Polarized training',
    fr: 'Entraînement polarisé',
    es: 'Entrenamiento polarizado',
    it: 'Allenamento polarizzato',
    'pt-br': 'Treino polarizado',
  },
  title: {
    en: 'Polarized training: definition, formula, example',
    fr: 'Qu’est-ce que l’entraînement polarisé ? Définition, exemple',
    es: '¿Qué es el entrenamiento polarizado? Definición y ejemplo',
    it: 'Cos’è l’allenamento polarizzato? Definizione, formula, esempio',
    'pt-br': 'O que é treino polarizado? Definição, fórmula e exemplo',
  },
  description: {
    en: 'Polarized training: the 80/20 intensity split, the three zones behind it, the polarization index with a worked example, and what the studies show.',
    fr: 'L’entraînement polarisé : la répartition 80/20, les trois zones, l’indice de polarisation avec un exemple chiffré et ce que montrent les études.',
    es: 'El entrenamiento polarizado: el reparto 80/20, las tres zonas, el índice de polarización con un ejemplo resuelto y lo que muestran los estudios.',
    it: 'L’allenamento polarizzato: la distribuzione 80/20, le tre zone, l’indice di polarizzazione con un esempio di calcolo e cosa dicono gli studi.',
    'pt-br':
      'Treino polarizado: a divisão 80/20, as três zonas, o índice de polarização com um exemplo calculado e o que os estudos mostram.',
  },
  definition: {
    en: 'Polarized training is a training intensity distribution in which most of the volume is done below the first threshold, a smaller share above the second threshold, and very little between the two.',
    fr: 'L’entraînement polarisé est une répartition de l’intensité où l’essentiel du volume se fait sous le premier seuil, une part plus faible au-dessus du second seuil, et très peu entre les deux.',
    es: 'El entrenamiento polarizado es una distribución de la intensidad en la que la mayor parte del volumen se hace por debajo del primer umbral, una parte menor por encima del segundo y muy poco entre ambos.',
    it: 'L’allenamento polarizzato è una distribuzione dell’intensità in cui gran parte del volume si svolge sotto la prima soglia, una quota minore sopra la seconda e pochissimo tra le due.',
    'pt-br':
      'Treino polarizado é uma distribuição de intensidade em que a maior parte do volume é feita abaixo do primeiro limiar, uma fatia menor acima do segundo e muito pouco entre os dois.',
  },
  aliases: {
    en: ['80/20 training', 'Polarised training', 'Polarization index'],
    fr: [
      'Méthode 80/20',
      'Polarisation de l’entraînement',
      'Indice de polarisation',
    ],
    es: ['Entrenamiento 80/20', 'Índice de polarización'],
    it: ['Allenamento 80/20', 'Indice di polarizzazione'],
    'pt-br': ['Treino 80/20', 'Índice de polarização'],
  },
  faq: {
    en: [
      {
        question: 'Is polarized training the same as 80/20 running?',
        answer:
          'Roughly. 80/20 is the session count Seiler observed in elite athletes: about 80% easy sessions, 20% hard ones. Polarized adds a condition: the hard work sits above the second threshold, and little time is spent between the two thresholds.',
      },
      {
        question: 'Is zone 2 training allowed in a polarized plan?',
        answer:
          'Yes, if you mean zone 2 of a five-zone watch system: that is easy endurance, which belongs to zone 1 of the three-zone model. What a polarized plan keeps short is the middle zone of the three-zone model, between the two thresholds.',
      },
      {
        question: 'Does polarized training suit beginners?',
        answer:
          'The studies were run on trained or elite athletes. For a runner with three or four sessions a week, mostly easy running with one harder session is a safe start; whether that session should be intervals or threshold work is still debated.',
      },
    ],
    fr: [
      {
        question:
          'Entraînement polarisé et méthode 80/20, c’est la même chose ?',
        answer:
          'À peu près. Le 80/20 est le décompte de séances observé par Seiler chez les athlètes d’élite : environ 80 % de séances faciles et 20 % de séances dures. Le polarisé ajoute une condition : le travail dur se fait au-dessus du second seuil, et l’on passe peu de temps entre les deux seuils.',
      },
      {
        question: 'Peut-on faire de la zone 2 dans un plan polarisé ?',
        answer:
          'Oui, s’il s’agit de la zone 2 d’une montre à cinq zones : c’est de l’endurance fondamentale, qui appartient à la zone 1 du modèle à trois zones. Ce que le polarisé limite, c’est la zone intermédiaire du modèle à trois zones, entre les deux seuils.',
      },
      {
        question: 'L’entraînement polarisé convient-il aux débutants ?',
        answer:
          'Les études portent sur des athlètes entraînés ou d’élite. Pour un coureur à trois ou quatre séances par semaine, beaucoup d’endurance fondamentale et une séance plus soutenue est un bon départ ; savoir si cette séance doit être du fractionné ou du seuil reste débattu.',
      },
    ],
    es: [
      {
        question: '¿El entrenamiento polarizado es lo mismo que el 80/20?',
        answer:
          'Más o menos. El 80/20 es el recuento de sesiones que Seiler observó en atletas de élite: alrededor de un 80 % de sesiones suaves y un 20 % duras. El polarizado añade una condición: el trabajo duro va por encima del segundo umbral y se pasa poco tiempo entre los dos umbrales.',
      },
      {
        question: '¿Se puede entrenar en zona 2 en un plan polarizado?',
        answer:
          'Sí, si hablas de la zona 2 de un reloj de cinco zonas: es resistencia aeróbica suave, que pertenece a la zona 1 del modelo de tres zonas. Lo que el polarizado limita es la zona intermedia del modelo de tres zonas, entre los dos umbrales.',
      },
      {
        question: '¿El entrenamiento polarizado sirve para principiantes?',
        answer:
          'Los estudios se hicieron con deportistas entrenados o de élite. Para quien corre tres o cuatro veces por semana, mucho rodaje suave y una sesión más exigente es un buen comienzo; si esa sesión debe ser de series o de umbral sigue en debate.',
      },
    ],
    it: [
      {
        question: 'Allenamento polarizzato e 80/20 sono la stessa cosa?',
        answer:
          'Più o meno. L’80/20 è il conteggio delle sedute osservato da Seiler negli atleti d’élite: circa 80% di sedute facili e 20% dure. Il polarizzato aggiunge una condizione: il lavoro duro sta sopra la seconda soglia e si passa poco tempo tra le due soglie.',
      },
      {
        question: 'Si può fare zona 2 in un piano polarizzato?',
        answer:
          'Sì, se parli della zona 2 di un orologio a cinque zone: è fondo lento, che appartiene alla zona 1 del modello a tre zone. Quello che il polarizzato limita è la zona intermedia del modello a tre zone, tra le due soglie.',
      },
      {
        question: 'L’allenamento polarizzato va bene per chi inizia?',
        answer:
          'Gli studi riguardano atleti allenati o d’élite. Per chi corre tre o quattro volte a settimana, tanta corsa facile e una seduta più impegnativa è un buon punto di partenza; se quella seduta debba essere di ripetute o di soglia è ancora discusso.',
      },
    ],
    'pt-br': [
      {
        question: 'Treino polarizado é a mesma coisa que 80/20?',
        answer:
          'Mais ou menos. O 80/20 é a contagem de sessões que Seiler observou em atletas de elite: cerca de 80% de sessões leves e 20% fortes. O polarizado acrescenta uma condição: o trabalho forte fica acima do segundo limiar, e se passa pouco tempo entre os dois limiares.',
      },
      {
        question: 'Dá para treinar na zona 2 num plano polarizado?',
        answer:
          'Sim, se for a zona 2 de um relógio de cinco zonas: é rodagem leve, que pertence à zona 1 do modelo de três zonas. O que o polarizado limita é a zona intermediária do modelo de três zonas, entre os dois limiares.',
      },
      {
        question: 'Treino polarizado serve para iniciantes?',
        answer:
          'Os estudos foram feitos com atletas treinados ou de elite. Para quem corre três ou quatro vezes por semana, muita rodagem leve e um treino mais forte é um bom começo; se esse treino deve ser de tiros ou de limiar ainda é discutido.',
      },
    ],
  },
  related: [
    'zone-2',
    'lactate-threshold',
    'critical-speed',
    'heart-rate-reserve',
    'trimp',
  ],
  links: [
    '/tools/heart-rate-zones',
    '/features/training-load',
    '/training-plans/running',
  ],
  sources: [
    {
      citation:
        'Seiler KS, Kjerland GØ (2006). Quantifying training intensity distribution in elite endurance athletes: is there evidence for an “optimal” distribution? Scandinavian Journal of Medicine & Science in Sports 16(1): 49–56.',
      url: 'https://doi.org/10.1111/j.1600-0838.2004.00418.x',
    },
    {
      citation:
        'Seiler S (2010). What is best practice for training intensity and duration distribution in endurance athletes? International Journal of Sports Physiology and Performance 5(3): 276–291.',
      url: 'https://doi.org/10.1123/ijspp.5.3.276',
    },
    {
      citation:
        'Stöggl T, Sperlich B (2014). Polarized training has greater impact on key endurance variables than threshold, high intensity, or high volume training. Frontiers in Physiology 5: 33.',
      url: 'https://doi.org/10.3389/fphys.2014.00033',
    },
    {
      citation:
        'Treff G, Winkert K, Sareban M, Steinacker JM, Sperlich B (2019). The polarization-index: a simple calculation to distinguish polarized from non-polarized training intensity distributions. Frontiers in Physiology 10: 707.',
      url: 'https://doi.org/10.3389/fphys.2019.00707',
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

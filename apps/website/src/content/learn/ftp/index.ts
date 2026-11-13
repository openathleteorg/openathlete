import type { LearnTerm } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const ftp: LearnTerm = {
  slug: 'ftp',
  theme: 'intensity',
  name: {
    en: 'FTP (functional threshold power)',
    fr: 'FTP (puissance au seuil fonctionnel)',
    es: 'FTP (umbral de potencia funcional)',
    it: 'FTP (potenza di soglia funzionale)',
    'pt-br': 'FTP (potência de limiar funcional)',
    de: 'FTP (funktionelle Schwellenleistung)',
  },
  title: {
    en: 'FTP (functional threshold power): definition, formula, example',
    fr: 'Qu’est-ce que la FTP ? Définition, formule, exemple',
    es: '¿Qué es el FTP? Definición, fórmula y ejemplo',
    it: 'Cos’è l’FTP? Definizione, formula, esempio',
    'pt-br': 'O que é FTP? Definição, fórmula e exemplo',
    de: 'FTP (funktionelle Schwellenleistung): Definition, Formel',
  },
  description: {
    en: 'FTP is the power you can hold for about an hour. The 20-minute test, critical power and W′, power zones in watts, a worked example and the limits.',
    fr: 'La FTP est la puissance tenable environ une heure. Test de 20 minutes, puissance critique et W′, zones en watts, exemple chiffré et limites.',
    es: 'El FTP es la potencia que aguantas cerca de una hora. Test de 20 minutos, potencia crítica y W′, zonas en vatios, ejemplo resuelto y límites.',
    it: 'L’FTP è la potenza che tieni per circa un’ora. Test di 20 minuti, potenza critica e W′, zone in watt, un esempio di calcolo e i limiti.',
    'pt-br':
      'O FTP é a potência que você sustenta por cerca de uma hora. Teste de 20 minutos, potência crítica e W′, zonas em watts, exemplo e limites.',
    de: 'Die FTP ist die Leistung, die du etwa eine Stunde hältst: 20-Minuten-Test, kritische Leistung und W′, Leistungszonen in Watt, Beispiel und Grenzen.',
  },
  definition: {
    en: 'FTP (functional threshold power) is the highest power, in watts, that you can hold in a roughly steady state for about an hour, usually estimated as 95% of a 20-minute all-out effort.',
    fr: 'La FTP (functional threshold power) est la puissance la plus élevée, en watts, que vous pouvez tenir de façon à peu près stable pendant environ une heure, estimée en général à 95 % d’un effort de 20 minutes à fond.',
    es: 'El FTP (functional threshold power) es la potencia más alta, en vatios, que puedes mantener de forma más o menos estable durante una hora aproximadamente, estimada normalmente como el 95 % de un esfuerzo de 20 minutos a tope.',
    it: 'L’FTP (functional threshold power) è la potenza più alta, in watt, che riesci a tenere in modo più o meno stabile per circa un’ora, di solito stimata come il 95% di uno sforzo di 20 minuti a tutta.',
    'pt-br':
      'O FTP (functional threshold power) é a maior potência, em watts, que você consegue sustentar de forma mais ou menos estável por cerca de uma hora, normalmente estimada como 95% de um esforço máximo de 20 minutos.',
    de: 'Die FTP (functional threshold power, funktionelle Schwellenleistung) ist die höchste Leistung in Watt, die du etwa eine Stunde lang annähernd konstant halten kannst, meist geschätzt als 95 % eines 20-minütigen Maximaltests.',
  },
  aliases: {
    en: ['Functional threshold power', 'Critical power', 'CP', 'W′'],
    fr: ['Functional threshold power', 'Puissance critique', 'PC', 'W′'],
    es: ['Functional threshold power', 'Potencia crítica', 'CP', 'W′'],
    it: ['Functional threshold power', 'Potenza critica', 'CP', 'W′'],
    'pt-br': ['Functional threshold power', 'Potência crítica', 'CP', 'W′'],
    de: ['Funktionelle Schwellenleistung', 'Kritische Leistung', 'CP', 'W′'],
  },
  faq: {
    en: [
      {
        question: 'What is a good FTP?',
        answer:
          'Watts alone say little, because a heavier rider produces more. Compare watts per kilogram, and above all compare with yourself: your FTP from last season or from six weeks ago tells you more than any table.',
      },
      {
        question: 'Is FTP the same as critical power?',
        answer:
          'No. FTP is a field estimate of the power you can hold for about an hour; critical power is the slope of the work-time line from several all-out efforts. They often land within a few watts on average, but for a given rider the gap can reach 20 to 30 W.',
      },
      {
        question: 'How often should I test my FTP?',
        answer:
          'Every six to eight weeks during a training block is enough for most people, or sooner when threshold sessions start to feel clearly too easy or impossible to finish.',
      },
    ],
    fr: [
      {
        question: 'Qu’est-ce qu’une bonne FTP ?',
        answer:
          'Les watts seuls disent peu de chose, puisqu’un cycliste plus lourd en produit davantage. Comparez les watts par kilo, et surtout comparez-vous à vous-même : votre FTP de la saison dernière ou d’il y a six semaines en dit plus que n’importe quel tableau.',
      },
      {
        question: 'La FTP est-elle la même chose que la puissance critique ?',
        answer:
          'Non. La FTP est une estimation de terrain de la puissance tenable environ une heure ; la puissance critique est la pente de la droite travail-durée tirée de plusieurs efforts à fond. Elles tombent souvent à quelques watts l’une de l’autre en moyenne, mais pour un cycliste donné l’écart peut atteindre 20 à 30 W.',
      },
      {
        question: 'À quelle fréquence refaire un test de FTP ?',
        answer:
          'Toutes les six à huit semaines pendant un bloc d’entraînement suffit à la plupart, ou plus tôt quand les séances au seuil deviennent nettement trop faciles ou impossibles à terminer.',
      },
    ],
    es: [
      {
        question: '¿Qué es un buen FTP?',
        answer:
          'Los vatios por sí solos dicen poco, porque un ciclista más pesado genera más. Compara los vatios por kilo y, sobre todo, compárate contigo: tu FTP de la temporada pasada o de hace seis semanas dice más que cualquier tabla.',
      },
      {
        question: '¿El FTP es lo mismo que la potencia crítica?',
        answer:
          'No. El FTP es una estimación de campo de la potencia que aguantas cerca de una hora; la potencia crítica es la pendiente de la recta trabajo-tiempo de varios esfuerzos a tope. De media suelen quedar a pocos vatios, pero en un ciclista concreto la diferencia puede llegar a 20 o 30 W.',
      },
      {
        question: '¿Cada cuánto debo hacer el test de FTP?',
        answer:
          'Cada seis a ocho semanas durante un bloque de entrenamiento basta para la mayoría, o antes si las sesiones de umbral empiezan a resultar claramente demasiado fáciles o imposibles de terminar.',
      },
    ],
    it: [
      {
        question: 'Qual è un buon FTP?',
        answer:
          'I watt da soli dicono poco, perché un ciclista più pesante ne produce di più. Confronta i watt per chilo e soprattutto confrontati con te stesso: il tuo FTP della scorsa stagione o di sei settimane fa dice più di qualsiasi tabella.',
      },
      {
        question: 'L’FTP è la stessa cosa della potenza critica?',
        answer:
          'No. L’FTP è una stima da campo della potenza che tieni per circa un’ora; la potenza critica è la pendenza della retta lavoro-tempo ricavata da più sforzi a tutta. In media cadono spesso a pochi watt, ma per il singolo ciclista lo scarto può arrivare a 20–30 W.',
      },
      {
        question: 'Ogni quanto ripetere il test dell’FTP?',
        answer:
          'Ogni sei-otto settimane durante un blocco di allenamento basta per la maggior parte delle persone, o prima se le sedute alla soglia diventano chiaramente troppo facili o impossibili da finire.',
      },
    ],
    'pt-br': [
      {
        question: 'O que é um bom FTP?',
        answer:
          'Os watts sozinhos dizem pouco, porque um ciclista mais pesado gera mais. Compare watts por quilo e, principalmente, compare com você mesmo: o seu FTP da temporada passada ou de seis semanas atrás diz mais que qualquer tabela.',
      },
      {
        question: 'FTP é a mesma coisa que potência crítica?',
        answer:
          'Não. O FTP é uma estimativa de campo da potência que você sustenta por cerca de uma hora; a potência crítica é a inclinação da reta trabalho-tempo de vários esforços máximos. Na média costumam ficar a poucos watts, mas para um ciclista específico a diferença pode chegar a 20 ou 30 W.',
      },
      {
        question: 'Com que frequência devo refazer o teste de FTP?',
        answer:
          'A cada seis a oito semanas durante um bloco de treino basta para a maioria, ou antes se os treinos de limiar ficarem claramente fáceis demais ou impossíveis de terminar.',
      },
    ],
    de: [
      {
        question: 'Was ist eine gute FTP?',
        answer:
          'Watt allein sagen wenig, denn ein schwererer Fahrer leistet mehr. Vergleiche Watt pro Kilogramm und vor allem dich mit dir selbst: Deine FTP aus der letzten Saison oder von vor sechs Wochen sagt dir mehr als jede Tabelle.',
      },
      {
        question: 'Ist die FTP dasselbe wie die kritische Leistung?',
        answer:
          'Nein. Die FTP ist eine Feldschätzung der Leistung, die du etwa eine Stunde halten kannst; die kritische Leistung ist die Steigung der Arbeit-Zeit-Geraden aus mehreren Maximalbelastungen. Im Mittel liegen sie oft nur wenige Watt auseinander, beim einzelnen Fahrer kann die Differenz aber 20 bis 30 W erreichen.',
      },
      {
        question: 'Wie oft sollte ich meine FTP testen?',
        answer:
          'Für die meisten reicht es, während eines Trainingsblocks alle sechs bis acht Wochen zu testen, oder früher, wenn sich Schwelleneinheiten deutlich zu leicht anfühlen oder kaum noch zu schaffen sind.',
      },
    ],
  },
  related: [
    'critical-speed',
    'lactate-threshold',
    'heart-rate-reserve',
    'polarized-training',
    'zone-2',
    'trimp',
  ],
  links: ['/features/workout-builder', '/features/training-load'],
  sources: [
    {
      citation:
        'Allen H, Coggan A (2010). Training and Racing with a Power Meter, 2nd edition. Boulder: VeloPress.',
    },
    {
      citation:
        'Monod H, Scherrer J (1965). The work capacity of a synergic muscular group. Ergonomics 8(3): 329–338.',
      url: 'https://doi.org/10.1080/00140136508930810',
    },
    {
      citation:
        'Poole DC, Burnley M, Vanhatalo A, Rossiter HB, Jones AM (2016). Critical power: an important fatigue threshold in exercise physiology. Medicine & Science in Sports & Exercise 48(11): 2320–2334.',
      url: 'https://doi.org/10.1249/MSS.0000000000000939',
    },
    {
      citation:
        'Borszcz FK, Tramontin AF, Bossi AH, Carminatti LJ, Costa VP (2018). Functional threshold power in cyclists: validity of the concept and physiological responses. International Journal of Sports Medicine 39(10): 737–742.',
      url: 'https://doi.org/10.1055/s-0044-101546',
    },
    {
      citation:
        'Karsten B, Petrigna L, Klose A, Bianco A, Townsend N, Triska C (2021). Relationship between the critical power test and a 20-min functional threshold power test in cycling. Frontiers in Physiology 11: 613151.',
      url: 'https://doi.org/10.3389/fphys.2020.613151',
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

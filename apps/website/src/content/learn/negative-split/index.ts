import type { LearnTerm } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const negativeSplit: LearnTerm = {
  slug: 'negative-split',
  theme: 'racing',
  name: {
    en: 'Negative split',
    fr: 'Negative split',
    es: 'Split negativo',
    it: 'Negative split',
    'pt-br': 'Split negativo',
    de: 'Negative Split',
  },
  title: {
    en: 'Negative split: definition, formula, example',
    fr: 'Qu’est-ce que le negative split ? Définition, formule, exemple',
    es: '¿Qué es el split negativo? Definición, fórmula y ejemplo',
    it: 'Cos’è il negative split? Definizione, formula, esempio',
    'pt-br': 'O que é split negativo? Definição, fórmula e exemplo',
    de: 'Negative Split: Definition, Formel, Beispiel',
  },
  description: {
    en: 'A negative split is a faster second half. How to measure the split in %, a 10K and marathon example, how to pace it, and what the research says.',
    fr: 'Le negative split, c’est une seconde moitié plus rapide. Calcul de l’écart en %, exemples sur 10 km et marathon, gestion d’allure et ce que dit la science.',
    es: 'El split negativo es una segunda mitad más rápida. Cómo calcularlo en %, ejemplos en 10K y maratón, cómo dosificar el ritmo y qué dice la ciencia.',
    it: 'Il negative split è una seconda metà più veloce. Come calcolarlo in %, esempi su 10 km e maratona, come gestire il passo e cosa dice la ricerca.',
    'pt-br':
      'Split negativo é uma segunda metade mais rápida. Como calcular em %, exemplos no 10 km e na maratona, como dosar o pace e o que diz a ciência.',
    de: 'Ein Negative Split ist eine schnellere zweite Hälfte. So misst du den Split in %, mit Beispielen für 10 km und Marathon, Pacing-Tipps und Studienlage.',
  },
  definition: {
    en: 'A negative split is a race or run in which the second half is covered faster than the first.',
    fr: 'Le negative split désigne une course ou une sortie dont la seconde moitié est courue plus vite que la première.',
    es: 'El split negativo es una carrera o un entrenamiento en el que la segunda mitad se corre más rápido que la primera.',
    it: 'Il negative split è una gara o un allenamento in cui la seconda metà viene corsa più veloce della prima.',
    'pt-br':
      'Split negativo é uma prova ou um treino em que a segunda metade é corrida mais rápido que a primeira.',
    de: 'Ein Negative Split ist ein Wettkampf oder Lauf, bei dem die zweite Hälfte schneller zurückgelegt wird als die erste.',
  },
  aliases: {
    en: ['Negative splits', 'Positive split', 'Even pacing'],
    fr: ['Split négatif', 'Positive split', 'Allure régulière'],
    es: ['Negative split', 'Split positivo', 'Ritmo constante'],
    it: ['Split negativo', 'Positive split', 'Andatura regolare'],
    'pt-br': ['Negative split', 'Split positivo', 'Ritmo constante'],
    de: ['Negative Splits', 'Positive Split', 'Gleichmäßiges Tempo'],
  },
  faq: {
    en: [
      {
        question: 'Is a negative split always faster than an even pace?',
        answer:
          'No. Over long distances, even pacing with at most a slight negative lean seems to work best. Marathon world records have on average been run slightly faster in the first half, and the most recent ones were the most even. A big negative split often means the start was too cautious.',
      },
      {
        question: 'How much slower should I start a marathon?',
        answer:
          'Only a little: 5 to 10 seconds per kilometre slower than goal pace for the first 3 to 5 km, then settle at goal pace. Over the whole first half, that adds up to under a minute.',
      },
      {
        question: 'Does a negative split make sense in a trail race?',
        answer:
          'Comparing halves by time rarely means much on trails, because the terrain and climbing are rarely spread evenly. The idea behind it still applies: start at an effort you can hold, and judge pacing by effort and heart rate rather than by the clock.',
      },
    ],
    fr: [
      {
        question:
          'Un negative split est-il toujours plus rapide qu’une allure régulière ?',
        answer:
          'Non. Sur longue distance, une allure régulière avec tout au plus une légère accélération semble fonctionner le mieux. Les records du monde du marathon ont en moyenne été courus un peu plus vite en première moitié, et les plus récents sont les plus réguliers. Un gros negative split signale souvent un départ trop prudent.',
      },
      {
        question: 'De combien faut-il partir plus lentement sur marathon ?',
        answer:
          'De peu : 5 à 10 secondes au kilomètre de plus que l’allure cible sur les 3 à 5 premiers kilomètres, puis on se cale à l’allure prévue. Sur l’ensemble de la première moitié, cela représente moins d’une minute.',
      },
      {
        question: 'Le negative split a-t-il un sens en trail ?',
        answer:
          'Comparer les moitiés au chrono a rarement du sens en trail, car le terrain et le dénivelé sont rarement répartis équitablement. L’idée reste valable : partir à un effort tenable et juger sa gestion à l’effort et à la fréquence cardiaque plutôt qu’au chrono.',
      },
    ],
    es: [
      {
        question:
          '¿Un split negativo siempre es más rápido que un ritmo constante?',
        answer:
          'No. En distancias largas parece funcionar mejor un ritmo constante con, como mucho, una ligera tendencia negativa. Los récords mundiales de maratón se han corrido de media un poco más rápido en la primera mitad, y los más recientes son los más regulares. Un split negativo muy grande suele indicar una salida demasiado prudente.',
      },
      {
        question: '¿Cuánto más lento hay que salir en un maratón?',
        answer:
          'Poco: entre 5 y 10 segundos por kilómetro más lento que el ritmo objetivo durante los primeros 3 a 5 km, y después al ritmo previsto. En toda la primera mitad, eso suma menos de un minuto.',
      },
      {
        question: '¿Tiene sentido el split negativo en trail?',
        answer:
          'Comparar mitades por tiempo rara vez tiene sentido en trail, porque el terreno y el desnivel casi nunca están repartidos por igual. La idea de fondo sigue valiendo: sal a un esfuerzo que puedas mantener y juzga el ritmo por sensaciones y pulso más que por el reloj.',
      },
    ],
    it: [
      {
        question: 'Il negative split è sempre più veloce di un passo regolare?',
        answer:
          'No. Sulle lunghe distanze sembra funzionare meglio un passo regolare con al massimo una leggera tendenza negativa. I record del mondo di maratona sono stati corsi in media un po’ più veloci nella prima metà, e i più recenti sono i più regolari. Un negative split molto ampio spesso indica una partenza troppo prudente.',
      },
      {
        question: 'Di quanto partire più piano in maratona?',
        answer:
          'Di poco: da 5 a 10 secondi al km più piano del passo obiettivo nei primi 3-5 km, poi ci si assesta sul passo previsto. Su tutta la prima metà, fa meno di un minuto.',
      },
      {
        question: 'Il negative split ha senso nel trail?',
        answer:
          'Confrontare le metà a tempo ha raramente senso nel trail, perché terreno e dislivello quasi mai sono distribuiti in modo uniforme. L’idea resta valida: parti a uno sforzo che puoi tenere e valuta la gestione da sensazioni e frequenza cardiaca più che dal cronometro.',
      },
    ],
    'pt-br': [
      {
        question: 'Split negativo é sempre mais rápido que ritmo constante?',
        answer:
          'Não. Em distâncias longas, um ritmo constante com no máximo uma leve tendência negativa parece funcionar melhor. Os recordes mundiais da maratona foram corridos, em média, um pouco mais rápido na primeira metade, e os mais recentes são os mais regulares. Um split negativo muito grande costuma indicar largada conservadora demais.',
      },
      {
        question: 'Quanto mais devagar devo largar na maratona?',
        answer:
          'Pouco: de 5 a 10 segundos por km mais devagar que o pace-alvo nos primeiros 3 a 5 km, depois entrar no pace previsto. Na primeira metade inteira, isso soma menos de um minuto.',
      },
      {
        question: 'Split negativo faz sentido no trail?',
        answer:
          'Comparar metades pelo tempo raramente faz sentido no trail, porque terreno e altimetria quase nunca estão distribuídos por igual. A ideia continua valendo: largue num esforço que você consegue manter e avalie o ritmo pela sensação e pela frequência cardíaca, não pelo relógio.',
      },
    ],
    de: [
      {
        question:
          'Ist ein Negative Split immer schneller als ein gleichmäßiges Tempo?',
        answer:
          'Nein. Auf langen Distanzen scheint ein gleichmäßiges Tempo mit höchstens leichter Tendenz nach negativ am besten zu funktionieren. Marathon-Weltrekorde wurden im Schnitt in der ersten Hälfte etwas schneller gelaufen, und die jüngsten waren die gleichmäßigsten. Ein großer Negative Split bedeutet oft, dass der Start zu vorsichtig war.',
      },
      {
        question: 'Wie viel langsamer sollte ich einen Marathon beginnen?',
        answer:
          'Nur ein wenig: auf den ersten 3 bis 5 km 5 bis 10 Sekunden pro Kilometer langsamer als die Zielpace, dann auf Zielpace einpendeln. Über die gesamte erste Hälfte summiert sich das auf weniger als eine Minute.',
      },
      {
        question: 'Ergibt ein Negative Split beim Trailrunning Sinn?',
        answer:
          'Die Hälften nach Zeit zu vergleichen, ist auf Trails selten aussagekräftig, weil Gelände und Höhenmeter kaum je gleichmäßig verteilt sind. Die Idee dahinter gilt trotzdem: Starte mit einer Anstrengung, die du halten kannst, und beurteile dein Pacing nach Gefühl und Herzfrequenz statt nach der Uhr.',
      },
    ],
  },
  related: [
    'grade-adjusted-pace',
    'critical-speed',
    'lactate-threshold',
    'km-effort',
    'vma',
  ],
  links: [
    '/tools/race-predictor',
    '/pace-charts',
    '/tools/pace-calculator',
    '/training-plans/running',
  ],
  sources: [
    {
      citation:
        'Abbiss CR, Laursen PB (2008). Describing and understanding pacing strategies during athletic competition. Sports Medicine 38(3): 239–252.',
      url: 'https://doi.org/10.2165/00007256-200838030-00004',
    },
    {
      citation:
        'Díaz JJ, Fernández-Ozcorta EJ, Santos-Concejero J (2018). The influence of pacing strategy on marathon world records. European Journal of Sport Science 18(6): 781–786.',
      url: 'https://doi.org/10.1080/17461391.2018.1450899',
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

import type { LearnTerm } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const gradeAdjustedPace: LearnTerm = {
  slug: 'grade-adjusted-pace',
  theme: 'racing',
  name: {
    en: 'Grade-adjusted pace (GAP)',
    fr: 'Allure ajustée à la pente (GAP)',
    es: 'Ritmo ajustado por pendiente (GAP)',
    it: 'Passo corretto per la pendenza (GAP)',
    'pt-br': 'Pace ajustado à inclinação (GAP)',
    de: 'Steigungsbereinigte Pace (GAP)',
  },
  title: {
    en: 'Grade-adjusted pace (GAP): definition, formula, example',
    fr: 'Qu’est-ce que l’allure ajustée à la pente ? Définition, formule',
    es: '¿Qué es el ritmo ajustado por pendiente? Definición y fórmula',
    it: 'Cos’è il passo corretto per la pendenza? Definizione, formula',
    'pt-br': 'O que é pace ajustado à inclinação? Definição e fórmula',
    de: 'Steigungsbereinigte Pace (GAP): Definition, Formel, Beispiel',
  },
  description: {
    en: 'Grade-adjusted pace (GAP) converts uphill and downhill pace into its flat equivalent. Minetti’s energy-cost formula, worked examples and limits.',
    fr: 'L’allure ajustée à la pente (GAP) convertit une allure en côte ou en descente en équivalent plat. Formule de Minetti, exemples chiffrés et limites.',
    es: 'El ritmo ajustado por pendiente (GAP) convierte el ritmo en subida o bajada en su equivalente en llano. Fórmula de Minetti, ejemplos y límites.',
    it: 'Il passo corretto per la pendenza (GAP) converte il passo in salita o discesa nel suo equivalente in piano. Formula di Minetti, esempi e limiti.',
    'pt-br':
      'O pace ajustado à inclinação (GAP) converte o pace de subida ou descida no equivalente no plano. Fórmula de Minetti, exemplos e limites.',
    de: 'Die steigungsbereinigte Pace (GAP) rechnet deine Pace bergauf und bergab in ihr Äquivalent im Flachen um. Minettis Formel, Rechenbeispiele und Grenzen.',
  },
  definition: {
    en: 'Grade-adjusted pace (GAP) is the pace on flat ground that would cost the same energy as the pace you ran on a slope, computed from the energy cost of running at each gradient.',
    fr: 'L’allure ajustée à la pente (GAP) est l’allure sur le plat qui coûterait la même énergie que celle courue dans une pente, calculée à partir du coût énergétique de la course selon l’inclinaison.',
    es: 'El ritmo ajustado por pendiente (GAP) es el ritmo en llano que costaría la misma energía que el ritmo que corriste en una cuesta, calculado a partir del coste energético de correr en cada pendiente.',
    it: 'Il passo corretto per la pendenza (GAP) è il passo in piano che costerebbe la stessa energia del passo corso in pendenza, calcolato dal costo energetico della corsa a ogni inclinazione.',
    'pt-br':
      'O pace ajustado à inclinação (GAP) é o pace no plano que custaria a mesma energia que o pace corrido numa inclinação, calculado a partir do custo energético de correr em cada inclinação.',
    de: 'Die steigungsbereinigte Pace (GAP) ist die Pace im Flachen, die dieselbe Energie kosten würde wie die Pace, die du am Hang gelaufen bist. Sie wird aus den Energiekosten des Laufens bei jeder Steigung berechnet.',
  },
  aliases: {
    en: ['GAP', 'Grade adjusted pace', 'Flat-equivalent pace'],
    fr: ['GAP', 'Allure équivalente plat', 'Grade-adjusted pace'],
    es: ['GAP', 'Ritmo equivalente en llano', 'Grade-adjusted pace'],
    it: ['GAP', 'Passo equivalente in piano', 'Grade-adjusted pace'],
    'pt-br': ['GAP', 'Pace equivalente no plano', 'Grade-adjusted pace'],
    de: ['GAP', 'Grade-adjusted Pace', 'Pace-Äquivalent im Flachen'],
  },
  faq: {
    en: [
      {
        question: 'Why is my GAP faster than my actual pace on a hilly run?',
        answer:
          'Because climbing costs more energy per metre than running on the flat. On an 8% climb a metre costs about 1.5 times as much, so 7:30/km there is worth roughly 4:58/km on the flat. Descents pull the other way, but less, so a hilly loop usually ends with a GAP faster than its raw average.',
      },
      {
        question: 'Why does GAP differ between apps?',
        answer:
          'Each app uses its own model and its own altitude smoothing. OpenAthlete uses Minetti’s 2002 treadmill curve with the gradient capped at ±30%; Strava uses a model it built from heart rate data, which gives less credit on descents. Compare runs within one app.',
      },
      {
        question: 'Does GAP work for walking up steep climbs?',
        answer:
          'Only roughly. Minetti’s curve is for running. On climbs steeper than about 15 to 20%, most trail runners walk, and walking has a different energy cost, so GAP on those sections is an approximation.',
      },
    ],
    fr: [
      {
        question:
          'Pourquoi ma GAP est-elle plus rapide que mon allure réelle sur une sortie vallonnée ?',
        answer:
          'Parce que monter coûte plus d’énergie par mètre que courir sur le plat. À 8 %, un mètre coûte environ 1,5 fois plus, donc 7:30/km y valent à peu près 4:58/km sur le plat. Les descentes jouent dans l’autre sens, mais moins fort : une boucle vallonnée finit donc souvent avec une GAP plus rapide que l’allure moyenne brute.',
      },
      {
        question: 'Pourquoi la GAP diffère-t-elle selon les applications ?',
        answer:
          'Chaque application a son modèle et son lissage de l’altitude. OpenAthlete utilise la courbe de Minetti (2002), mesurée sur tapis, avec une pente plafonnée à ±30 % ; Strava utilise un modèle construit à partir de données cardiaques, qui accorde moins de crédit aux descentes. Comparez vos sorties dans une même application.',
      },
      {
        question:
          'La GAP fonctionne-t-elle quand on marche dans les côtes raides ?',
        answer:
          'Seulement en gros. La courbe de Minetti concerne la course. Au-delà de 15 à 20 % de pente, la plupart des traileurs marchent, et la marche a un autre coût énergétique : sur ces portions, la GAP reste une approximation.',
      },
    ],
    es: [
      {
        question:
          '¿Por qué mi GAP es más rápido que mi ritmo real en una salida con desnivel?',
        answer:
          'Porque subir cuesta más energía por metro que correr en llano. Al 8 %, un metro cuesta alrededor de 1,5 veces más, así que 7:30/km ahí equivalen a unos 4:58/km en llano. Las bajadas restan, pero menos, por eso un recorrido con desnivel suele terminar con un GAP más rápido que el ritmo medio bruto.',
      },
      {
        question: '¿Por qué el GAP cambia según la aplicación?',
        answer:
          'Cada aplicación usa su propio modelo y su propio suavizado de la altitud. OpenAthlete usa la curva de Minetti (2002), medida en cinta, con la pendiente limitada a ±30 %; Strava usa un modelo construido con datos de frecuencia cardíaca, que da menos crédito a las bajadas. Compara tus salidas dentro de la misma aplicación.',
      },
      {
        question: '¿Sirve el GAP cuando subo andando cuestas muy empinadas?',
        answer:
          'Solo de forma aproximada. La curva de Minetti es para correr. Por encima de un 15 o 20 % de pendiente casi todos los corredores de trail caminan, y caminar tiene otro coste energético, así que en esos tramos el GAP es una aproximación.',
      },
    ],
    it: [
      {
        question:
          'Perché il mio GAP è più veloce del passo reale su un’uscita mossa?',
        answer:
          'Perché salire costa più energia per metro che correre in piano. All’8%, un metro costa circa 1,5 volte tanto, quindi 7:30/km lì valgono più o meno 4:58/km in piano. Le discese tolgono, ma meno, così un giro mosso di solito finisce con un GAP più veloce del passo medio grezzo.',
      },
      {
        question: 'Perché il GAP cambia da un’app all’altra?',
        answer:
          'Ogni app usa il suo modello e il suo modo di smussare l’altitudine. OpenAthlete usa la curva di Minetti (2002), misurata su tapis roulant, con la pendenza limitata a ±30%; Strava usa un modello costruito sui dati di frequenza cardiaca, che dà meno credito alle discese. Confronta le uscite nella stessa app.',
      },
      {
        question: 'Il GAP funziona quando cammino sulle salite ripide?',
        answer:
          'Solo in modo approssimativo. La curva di Minetti riguarda la corsa. Oltre il 15-20% di pendenza quasi tutti i trail runner camminano, e camminare ha un altro costo energetico: su quei tratti il GAP resta un’approssimazione.',
      },
    ],
    'pt-br': [
      {
        question:
          'Por que o meu GAP é mais rápido que o meu pace real num treino com subidas?',
        answer:
          'Porque subir custa mais energia por metro do que correr no plano. A 8%, um metro custa cerca de 1,5 vez mais, então 7:30/km ali valem uns 4:58/km no plano. As descidas puxam para o outro lado, mas menos, por isso um percurso com subidas costuma terminar com um GAP mais rápido que o pace médio bruto.',
      },
      {
        question: 'Por que o GAP muda de um app para outro?',
        answer:
          'Cada app usa o seu próprio modelo e a sua própria suavização da altitude. O OpenAthlete usa a curva de Minetti (2002), medida em esteira, com a inclinação limitada a ±30%; o Strava usa um modelo construído com dados de frequência cardíaca, que dá menos crédito às descidas. Compare os treinos dentro do mesmo app.',
      },
      {
        question: 'O GAP funciona quando eu caminho em subidas íngremes?',
        answer:
          'Só de forma aproximada. A curva de Minetti é para corrida. Acima de 15 a 20% de inclinação, quase todo corredor de trail caminha, e caminhar tem outro custo energético, então nesses trechos o GAP é uma aproximação.',
      },
    ],
    de: [
      {
        question:
          'Warum ist meine GAP bei einem hügeligen Lauf schneller als meine tatsächliche Pace?',
        answer:
          'Weil Bergauflaufen pro Meter mehr Energie kostet als Laufen im Flachen. Bei 8 % Steigung kostet ein Meter etwa das 1,5-Fache, 7:30/km sind dort also ungefähr 4:58/km im Flachen wert. Abstiege wirken in die andere Richtung, aber schwächer, deshalb endet eine hügelige Runde meist mit einer GAP, die schneller ist als die reine Durchschnittspace.',
      },
      {
        question: 'Warum unterscheidet sich die GAP zwischen Apps?',
        answer:
          'Jede App nutzt ihr eigenes Modell und ihre eigene Glättung der Höhendaten. OpenAthlete verwendet Minettis Laufbandkurve von 2002 mit einer auf ±30 % begrenzten Steigung, Strava ein Modell, das es aus Herzfrequenzdaten entwickelt hat und das Abstiege weniger stark anrechnet. Vergleiche Läufe innerhalb einer App.',
      },
      {
        question: 'Funktioniert die GAP, wenn ich steile Anstiege hochgehe?',
        answer:
          'Nur ungefähr. Minettis Kurve gilt fürs Laufen. Bei Anstiegen über etwa 15 bis 20 % gehen die meisten Trailrunner, und Gehen hat andere Energiekosten, die GAP ist auf diesen Abschnitten also eine Näherung.',
      },
    ],
  },
  related: ['km-effort', 'critical-speed', 'negative-split', 'vma'],
  links: [
    '/tools/grade-adjusted-pace',
    '/tools/trail-time-estimator',
    '/training-plans/trail',
    '/pace-charts',
  ],
  sources: [
    {
      citation:
        'Minetti AE, Moia C, Roi GS, Susta D, Ferretti G (2002). Energy cost of walking and running at extreme uphill and downhill slopes. Journal of Applied Physiology 93(3): 1039–1046.',
      url: 'https://doi.org/10.1152/japplphysiol.01177.2001',
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

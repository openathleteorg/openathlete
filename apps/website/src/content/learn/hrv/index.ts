import type { LearnTerm } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const hrv: LearnTerm = {
  slug: 'hrv',
  theme: 'load',
  name: {
    en: 'HRV (heart rate variability)',
    fr: 'VFC (variabilité de la fréquence cardiaque)',
    es: 'VFC (variabilidad de la frecuencia cardíaca)',
    it: 'HRV (variabilità della frequenza cardiaca)',
    'pt-br': 'VFC (variabilidade da frequência cardíaca)',
    de: 'HRV (Herzfrequenzvariabilität)',
  },
  title: {
    en: 'HRV (heart rate variability): definition, formula, example',
    fr: 'Qu’est-ce que la VFC ? Définition, formule, exemple',
    es: '¿Qué es la VFC? Definición, fórmula y ejemplo',
    it: 'Cos’è l’HRV? Definizione, formula, esempio',
    'pt-br': 'O que é VFC? Definição, fórmula e exemplo',
    de: 'HRV (Herzfrequenzvariabilität): Definition, Formel, Beispiel',
  },
  description: {
    en: 'Heart rate variability (HRV) explained for endurance athletes: the rMSSD formula, why to read ln rMSSD as a 7-day average, and a worked example.',
    fr: 'La variabilité de la fréquence cardiaque (VFC, HRV) expliquée aux sportifs d’endurance : formule du rMSSD, moyenne sur 7 jours et exemple chiffré.',
    es: 'La variabilidad de la frecuencia cardíaca (VFC, HRV) para deportistas de resistencia: fórmula del rMSSD, media de 7 días y un ejemplo con cifras.',
    it: 'La variabilità della frequenza cardiaca (HRV) spiegata a chi fa endurance: formula dell’rMSSD, media su 7 giorni ed esempio con i numeri.',
    'pt-br':
      'A variabilidade da frequência cardíaca (VFC, HRV) para atletas de endurance: fórmula do rMSSD, média de 7 dias e um exemplo com números.',
    de: 'Herzfrequenzvariabilität (HRV) für Ausdauersportler erklärt: die rMSSD-Formel, warum du ln rMSSD als 7-Tage-Mittel liest, und ein Rechenbeispiel.',
  },
  definition: {
    en: 'Heart rate variability (HRV) is the beat-to-beat variation in the time between heartbeats, most often reported as rMSSD in milliseconds, and used by athletes as a marker of how their autonomic nervous system is coping with training.',
    fr: 'La variabilité de la fréquence cardiaque (VFC) est la variation, d’un battement à l’autre, de l’intervalle entre deux battements du cœur, le plus souvent exprimée en rMSSD (millisecondes) et suivie par les sportifs comme indicateur de la façon dont leur système nerveux autonome encaisse l’entraînement.',
    es: 'La variabilidad de la frecuencia cardíaca (VFC) es la variación, latido a latido, del tiempo entre dos latidos del corazón; suele expresarse como rMSSD en milisegundos y los deportistas la siguen como indicador de cómo su sistema nervioso autónomo asimila el entrenamiento.',
    it: 'La variabilità della frequenza cardiaca (HRV) è la variazione, battito dopo battito, del tempo tra due battiti cardiaci, di solito espressa come rMSSD in millisecondi e seguita dagli atleti come indicatore di come il sistema nervoso autonomo regge l’allenamento.',
    'pt-br':
      'A variabilidade da frequência cardíaca (VFC) é a variação, batimento a batimento, do intervalo entre dois batimentos do coração, geralmente expressa como rMSSD em milissegundos e acompanhada pelos atletas como indicador de como o sistema nervoso autônomo está absorvendo o treino.',
    de: 'Die Herzfrequenzvariabilität (HRV) ist die Schwankung des Abstands zwischen zwei Herzschlägen von Schlag zu Schlag. Sie wird meist als rMSSD in Millisekunden angegeben und von Athleten als Marker dafür genutzt, wie ihr autonomes Nervensystem das Training verkraftet.',
  },
  aliases: {
    en: ['Heart rate variability', 'rMSSD', 'ln rMSSD'],
    fr: ['HRV', 'Variabilité cardiaque', 'rMSSD'],
    es: ['HRV', 'Variabilidad cardíaca', 'rMSSD'],
    it: ['Variabilità cardiaca', 'VFC', 'rMSSD'],
    'pt-br': ['HRV', 'Variabilidade cardíaca', 'rMSSD'],
    de: ['Herzfrequenzvariabilität', 'HFV', 'rMSSD'],
  },
  faq: {
    en: [
      {
        question: 'What is a good HRV for a runner?',
        answer:
          'There is no target value. Night-time rMSSD ranges from below 30 ms to over 100 ms between healthy, well-trained people, and depends on age, genetics and the device. Compare your 7-day average with your own baseline from the previous weeks, not with someone else.',
      },
      {
        question: 'Is a low HRV after a hard session a bad sign?',
        answer:
          'Not on its own. A dip for a night or two after a long run or a race is the normal response to a big load. What deserves attention is a 7-day average that stays below your usual range for a week or more, especially with poor sleep, a rising resting heart rate or sessions that feel harder than they should.',
      },
      {
        question: 'Why use the logarithm of rMSSD?',
        answer:
          'Daily rMSSD values are skewed: occasional very high nights pull a plain average up. Taking the natural log (ln rMSSD) makes the distribution more symmetrical, so averages and standard deviations behave better. That is the convention in most training studies.',
      },
    ],
    fr: [
      {
        question: 'Quelle est une bonne VFC pour un coureur ?',
        answer:
          'Il n’existe pas de valeur cible. Le rMSSD nocturne va de moins de 30 ms à plus de 100 ms entre personnes en bonne santé et bien entraînées, selon l’âge, la génétique et l’appareil. Comparez votre moyenne sur 7 jours à votre propre référence des semaines précédentes, pas à celle des autres.',
      },
      {
        question:
          'Une VFC basse après une grosse séance, est-ce mauvais signe ?',
        answer:
          'Pas en soi. Une baisse d’une ou deux nuits après une sortie longue ou une course est la réponse normale à une grosse charge. Ce qui mérite attention, c’est une moyenne sur 7 jours qui reste sous votre fourchette habituelle pendant une semaine ou plus, surtout avec un sommeil dégradé, une fréquence de repos qui monte ou des séances plus dures que prévu.',
      },
      {
        question: 'Pourquoi utiliser le logarithme du rMSSD ?',
        answer:
          'Les valeurs quotidiennes de rMSSD sont asymétriques : quelques nuits très hautes tirent la moyenne vers le haut. Le logarithme népérien (ln rMSSD) rend la distribution plus symétrique, et les moyennes et écarts-types se comportent mieux. C’est la convention de la plupart des études sur l’entraînement.',
      },
    ],
    es: [
      {
        question: '¿Cuál es una buena VFC para un corredor?',
        answer:
          'No hay un valor objetivo. El rMSSD nocturno va de menos de 30 ms a más de 100 ms entre personas sanas y bien entrenadas, según la edad, la genética y el dispositivo. Compara tu media de 7 días con tu propia referencia de las semanas anteriores, no con la de otros.',
      },
      {
        question: '¿Es mala señal una VFC baja después de una sesión dura?',
        answer:
          'No por sí sola. Una bajada de una o dos noches tras una tirada larga o una carrera es la respuesta normal a una carga grande. Lo que merece atención es una media de 7 días que se queda por debajo de tu rango habitual durante una semana o más, sobre todo si duermes mal, sube el pulso en reposo o las sesiones cuestan más de lo normal.',
      },
      {
        question: '¿Por qué se usa el logaritmo del rMSSD?',
        answer:
          'Los valores diarios de rMSSD son asimétricos: algunas noches muy altas tiran de la media hacia arriba. El logaritmo natural (ln rMSSD) hace la distribución más simétrica, así que medias y desviaciones típicas se comportan mejor. Es la convención en la mayoría de estudios de entrenamiento.',
      },
    ],
    it: [
      {
        question: 'Qual è una buona HRV per un runner?',
        answer:
          'Non esiste un valore obiettivo. L’rMSSD notturno va da meno di 30 ms a oltre 100 ms tra persone sane e ben allenate, a seconda di età, genetica e dispositivo. Confronta la tua media su 7 giorni con il tuo riferimento delle settimane precedenti, non con quello degli altri.',
      },
      {
        question: 'Un’HRV bassa dopo una seduta dura è un brutto segnale?',
        answer:
          'Non di per sé. Un calo di una o due notti dopo un lungo o una gara è la risposta normale a un carico importante. Merita attenzione una media su 7 giorni che resta sotto il tuo intervallo abituale per una settimana o più, soprattutto con sonno peggiore, frequenza a riposo in salita o sedute più faticose del previsto.',
      },
      {
        question: 'Perché si usa il logaritmo dell’rMSSD?',
        answer:
          'I valori giornalieri di rMSSD sono asimmetrici: qualche notte molto alta trascina la media verso l’alto. Il logaritmo naturale (ln rMSSD) rende la distribuzione più simmetrica, così medie e deviazioni standard si comportano meglio. È la convenzione nella maggior parte degli studi sull’allenamento.',
      },
    ],
    'pt-br': [
      {
        question: 'Qual é uma boa VFC para um corredor?',
        answer:
          'Não existe valor-alvo. O rMSSD noturno vai de menos de 30 ms a mais de 100 ms entre pessoas saudáveis e bem treinadas, conforme idade, genética e aparelho. Compare a sua média de 7 dias com a sua própria referência das semanas anteriores, não com a dos outros.',
      },
      {
        question: 'VFC baixa depois de um treino forte é mau sinal?',
        answer:
          'Não sozinha. Uma queda de uma ou duas noites depois de um longão ou de uma prova é a resposta normal a uma carga grande. O que merece atenção é uma média de 7 dias que fica abaixo da sua faixa habitual por uma semana ou mais, principalmente com sono ruim, frequência de repouso subindo ou treinos mais pesados do que deveriam.',
      },
      {
        question: 'Por que usar o logaritmo do rMSSD?',
        answer:
          'Os valores diários de rMSSD são assimétricos: algumas noites muito altas puxam a média para cima. O logaritmo natural (ln rMSSD) deixa a distribuição mais simétrica, e médias e desvios-padrão se comportam melhor. É a convenção da maioria dos estudos sobre treino.',
      },
    ],
    de: [
      {
        question: 'Was ist eine gute HRV für Läufer?',
        answer:
          'Einen Zielwert gibt es nicht. Die nächtliche rMSSD reicht bei gesunden, gut trainierten Menschen von unter 30 ms bis über 100 ms und hängt von Alter, Genetik und Gerät ab. Vergleiche deinen 7-Tage-Mittelwert mit deinem eigenen Ausgangswert aus den Wochen davor, nicht mit anderen.',
      },
      {
        question:
          'Ist eine niedrige HRV nach einer harten Einheit ein schlechtes Zeichen?',
        answer:
          'Für sich genommen nicht. Ein Einbruch für ein, zwei Nächte nach einem langen Lauf oder einem Wettkampf ist die normale Reaktion auf eine hohe Belastung. Aufmerksamkeit verdient ein 7-Tage-Mittelwert, der eine Woche oder länger unter deinem üblichen Bereich bleibt, besonders bei schlechtem Schlaf, steigendem Ruhepuls oder Einheiten, die sich härter anfühlen, als sie sollten.',
      },
      {
        question: 'Warum nimmt man den Logarithmus der rMSSD?',
        answer:
          'Die täglichen rMSSD-Werte sind schief verteilt: Einzelne sehr hohe Nächte ziehen einen einfachen Mittelwert nach oben. Der natürliche Logarithmus (ln rMSSD) macht die Verteilung symmetrischer, sodass sich Mittelwerte und Standardabweichungen besser verhalten. Das ist in den meisten Trainingsstudien üblich.',
      },
    ],
  },
  related: ['ctl-atl-tsb', 'session-rpe', 'trimp', 'taper'],
  links: [
    '/features/training-load',
    {
      href: '/connect',
      label: {
        en: 'Garmin, Polar, Suunto and COROS connections',
        fr: 'Connexions Garmin, Polar, Suunto et COROS',
        es: 'Conexiones con Garmin, Polar, Suunto y COROS',
        it: 'Collegamenti con Garmin, Polar, Suunto e COROS',
        'pt-br': 'Conexões com Garmin, Polar, Suunto e COROS',
        de: 'Verbindungen mit Garmin, Polar, Suunto und COROS',
      },
    },
    '/blog/5-signs-of-overtraining-and-how-to-avoid-it',
  ],
  sources: [
    {
      citation:
        'Task Force of the European Society of Cardiology and the North American Society of Pacing and Electrophysiology (1996). Heart rate variability: standards of measurement, physiological interpretation and clinical use. Circulation 93(5): 1043–1065.',
      url: 'https://doi.org/10.1161/01.CIR.93.5.1043',
    },
    {
      citation:
        'Plews DJ, Laursen PB, Stanley J, Kilding AE, Buchheit M (2013). Training adaptation and heart rate variability in elite endurance athletes: opening the door to effective monitoring. Sports Medicine 43(9): 773–781.',
      url: 'https://doi.org/10.1007/s40279-013-0071-8',
    },
    {
      citation:
        'Kiviniemi AM, Hautala AJ, Kinnunen H, Tulppo MP (2007). Endurance training guided individually by daily heart rate variability measurements. European Journal of Applied Physiology 101(6): 743–751.',
      url: 'https://doi.org/10.1007/s00421-007-0552-2',
    },
    {
      citation:
        'Buchheit M (2014). Monitoring training status with HR measures: do all roads lead to Rome? Frontiers in Physiology 5: 73.',
      url: 'https://doi.org/10.3389/fphys.2014.00073',
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

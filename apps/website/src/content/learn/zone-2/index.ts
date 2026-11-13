import type { LearnTerm } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const zone2: LearnTerm = {
  slug: 'zone-2',
  theme: 'intensity',
  name: {
    en: 'Zone 2',
    fr: 'Zone 2',
    es: 'Zona 2',
    it: 'Zona 2',
    'pt-br': 'Zona 2',
    de: 'Zone 2',
  },
  title: {
    en: 'Zone 2: definition, formula, example',
    fr: 'Qu’est-ce que la zone 2\u00a0? Définition, formule, exemple',
    es: '¿Qué es la zona 2? Definición, fórmula y ejemplo',
    it: 'Cos’è la zona 2? Definizione, formula, esempio',
    'pt-br': 'O que é a zona 2? Definição, fórmula e exemplo',
    de: 'Was ist Zone 2? Definition, Formel und Beispiel',
  },
  description: {
    en: 'Zone 2 heart rate: the Karvonen formula (60–70% of heart rate reserve), a worked example in bpm, how to train in it and why percentage zones can mislead.',
    fr: 'La zone 2 cardiaque\u00a0: formule de Karvonen (60 à 70\u00a0% de la FC de réserve), exemple en bpm, comment s’y entraîner et les limites des zones en pourcentage.',
    es: 'Zona 2 de frecuencia cardíaca: fórmula de Karvonen (60–70 % de la reserva), un ejemplo en ppm, cómo entrenar y por qué los porcentajes engañan.',
    it: 'Zona 2 cardiaca: formula di Karvonen (60–70% della riserva), un esempio in bpm, come allenarsi in zona 2 e perché le zone in percentuale ingannano.',
    'pt-br':
      'Zona 2 de frequência cardíaca: fórmula de Karvonen (60–70% da reserva), um exemplo em bpm, como treinar nela e por que as porcentagens enganam.',
    de: 'Zone 2 der Herzfrequenz: Karvonen-Formel (60–70 % der Reserve), ein Rechenbeispiel in bpm, Training in Zone 2 und warum Prozentzonen täuschen können.',
  },
  definition: {
    en: 'Zone 2 is the easy, steady intensity at or just below the first lactate threshold, usually set at 60 to 70% of heart rate reserve, where you can talk in full sentences and keep going for hours.',
    fr: 'La zone 2 est l’intensité facile et régulière située au premier seuil lactique ou juste en dessous, généralement fixée entre 60 et 70\u00a0% de la fréquence cardiaque de réserve, où l’on peut parler par phrases complètes et tenir des heures.',
    es: 'La zona 2 es la intensidad suave y constante en el primer umbral de lactato o justo por debajo, normalmente entre el 60 y el 70 % de la frecuencia cardíaca de reserva, en la que puedes hablar con frases completas y aguantar horas.',
    it: 'La zona 2 è l’intensità facile e costante alla prima soglia del lattato o appena sotto, di solito tra il 60 e il 70% della frequenza cardiaca di riserva, in cui riesci a parlare con frasi intere e a durare per ore.',
    'pt-br':
      'A zona 2 é a intensidade leve e constante no primeiro limiar de lactato ou logo abaixo, normalmente entre 60 e 70% da frequência cardíaca de reserva, em que você consegue falar frases completas e manter o esforço por horas.',
    de: 'Zone 2 ist die lockere, gleichmäßige Intensität an oder knapp unter der ersten Laktatschwelle, meist bei 60 bis 70 % der Herzfrequenzreserve angesetzt. Du kannst dabei in ganzen Sätzen sprechen und stundenlang weitermachen.',
  },
  aliases: {
    en: ['Zone 2 training', 'Easy run pace', 'Aerobic base'],
    fr: ['Endurance fondamentale', 'EF', 'Zone 2 cardio'],
    es: ['Entrenamiento en zona 2', 'Rodaje suave', 'Base aeróbica'],
    it: ['Allenamento in zona 2', 'Fondo lento', 'Corsa lenta'],
    'pt-br': ['Treino na zona 2', 'Rodagem leve', 'Base aeróbica'],
    de: ['Zone-2-Training', 'Grundlagenausdauer', 'GA1', 'Lockerer Dauerlauf'],
  },
  faq: {
    en: [
      {
        question: 'What pace is zone 2 running?',
        answer:
          'There is no universal pace: it is whatever pace keeps your heart rate in the zone on that day. For most runners it is clearly slower than marathon pace, and it slows down on hills, in heat and when you are tired.',
      },
      {
        question: 'How much of my training should be in zone 2?',
        answer:
          'Studies of elite endurance athletes find that most of their training time is spent at low intensity, often around three quarters or more. For amateurs, a good starting point is to keep most of your weekly running easy and limit hard sessions to one or two a week.',
      },
      {
        question: 'Is zone 2 the same on a bike and on foot?',
        answer:
          'Not exactly. Heart rate at the same effort is often lower on a bike than running, so many athletes use separate zones per sport. Set them from a maximum heart rate seen in each sport if you can.',
      },
    ],
    fr: [
      {
        question: 'À quelle allure court-on en zone 2\u00a0?',
        answer:
          'Il n’y a pas d’allure universelle\u00a0: c’est celle qui garde votre fréquence cardiaque dans la zone ce jour-là. Chez la plupart des coureurs, elle est nettement plus lente que l’allure marathon, et ralentit en côte, par forte chaleur ou quand la fatigue s’accumule.',
      },
      {
        question:
          'Quelle part de l’entraînement faut-il faire en zone 2\u00a0?',
        answer:
          'Les études sur les athlètes d’endurance de haut niveau montrent qu’ils passent la majorité de leur temps d’entraînement à basse intensité, souvent les trois quarts ou plus. Pour un amateur, un bon point de départ consiste à garder l’essentiel du kilométrage facile et à limiter les séances dures à une ou deux par semaine.',
      },
      {
        question: 'La zone 2 est-elle la même à vélo et à pied\u00a0?',
        answer:
          'Pas tout à fait. À effort égal, la fréquence cardiaque est souvent plus basse à vélo qu’en course à pied, d’où l’intérêt de zones séparées par sport, idéalement calées sur une FCmax relevée dans chaque discipline.',
      },
    ],
    es: [
      {
        question: '¿A qué ritmo se corre en zona 2?',
        answer:
          'No hay un ritmo universal: es el que mantiene tu pulso en la zona ese día. En la mayoría de corredores es claramente más lento que el ritmo de maratón, y baja en cuestas, con calor y cuando vas cansado.',
      },
      {
        question: '¿Cuánto de mi entrenamiento debería ser en zona 2?',
        answer:
          'Los estudios con atletas de resistencia de élite muestran que pasan la mayor parte de su tiempo a baja intensidad, a menudo tres cuartas partes o más. Para un popular, un buen punto de partida es que casi todo el kilometraje semanal sea suave y limitar las sesiones duras a una o dos por semana.',
      },
      {
        question: '¿La zona 2 es igual en bici que corriendo?',
        answer:
          'No exactamente. Con el mismo esfuerzo, el pulso suele ser más bajo en bici que corriendo, por eso muchos deportistas usan zonas distintas por deporte, a ser posible calculadas con una frecuencia máxima vista en cada uno.',
      },
    ],
    it: [
      {
        question: 'A che passo si corre in zona 2?',
        answer:
          'Non esiste un passo universale: è quello che tiene la tua frequenza in zona quel giorno. Per la maggior parte dei runner è nettamente più lento del passo maratona, e rallenta in salita, con il caldo e quando sei stanco.',
      },
      {
        question: 'Quanta parte dell’allenamento va fatta in zona 2?',
        answer:
          'Gli studi sugli atleti di resistenza d’élite mostrano che passano la maggior parte del tempo a bassa intensità, spesso tre quarti o più. Per un amatore, un buon punto di partenza è tenere facile quasi tutto il chilometraggio settimanale e limitare le sedute dure a una o due a settimana.',
      },
      {
        question: 'La zona 2 è la stessa in bici e a piedi?',
        answer:
          'Non proprio. A parità di sforzo la frequenza è spesso più bassa in bici che di corsa, quindi molti atleti usano zone diverse per sport, possibilmente calcolate da una frequenza massima vista in ciascuno.',
      },
    ],
    'pt-br': [
      {
        question: 'Qual é o pace da zona 2?',
        answer:
          'Não existe um pace universal: é aquele que mantém a sua frequência na zona naquele dia. Para a maioria dos corredores é bem mais lento que o pace de maratona, e cai nas subidas, no calor e quando você está cansado.',
      },
      {
        question: 'Quanto do meu treino deve ser na zona 2?',
        answer:
          'Estudos com atletas de endurance de elite mostram que eles passam a maior parte do tempo em baixa intensidade, muitas vezes três quartos ou mais. Para um amador, um bom ponto de partida é manter quase toda a quilometragem semanal leve e limitar os treinos fortes a um ou dois por semana.',
      },
      {
        question: 'A zona 2 é a mesma na bike e na corrida?',
        answer:
          'Não exatamente. No mesmo esforço, a frequência costuma ser mais baixa na bike que na corrida, por isso muitos atletas usam zonas separadas por esporte, de preferência calculadas com uma frequência máxima vista em cada um.',
      },
    ],
    de: [
      {
        question: 'In welcher Pace läuft man in Zone 2?',
        answer:
          'Eine universelle Pace gibt es nicht: Es ist die Pace, die deine Herzfrequenz an diesem Tag in der Zone hält. Bei den meisten Läufern ist sie deutlich langsamer als das Marathontempo und wird am Berg, bei Hitze und bei Müdigkeit langsamer.',
      },
      {
        question: 'Wie viel meines Trainings sollte in Zone 2 stattfinden?',
        answer:
          'Studien an Ausdauer-Spitzenathleten zeigen, dass sie den Großteil ihrer Trainingszeit bei niedriger Intensität verbringen, oft etwa drei Viertel oder mehr. Für Hobbysportler ist ein guter Ansatz, den Großteil des wöchentlichen Laufumfangs locker zu halten und harte Einheiten auf ein oder zwei pro Woche zu beschränken.',
      },
      {
        question: 'Ist Zone 2 auf dem Rad und beim Laufen gleich?',
        answer:
          'Nicht ganz. Die Herzfrequenz liegt bei gleicher Anstrengung auf dem Rad oft niedriger als beim Laufen, deshalb nutzen viele Athleten getrennte Zonen pro Sportart. Leg sie, wenn möglich, anhand einer in der jeweiligen Sportart gesehenen HFmax fest.',
      },
    ],
  },
  related: [
    'heart-rate-reserve',
    'polarized-training',
    'lactate-threshold',
    'aerobic-decoupling',
    'trimp',
  ],
  links: [
    '/tools/heart-rate-zones',
    '/features/training-load',
    '/pace-charts',
    '/blog/rpe-vs-heart-rate-why-your-heart-doesnt-tell-the-whole-story',
  ],
  sources: [
    {
      citation:
        'Seiler S (2010). What is best practice for training intensity and duration distribution in endurance athletes? International Journal of Sports Physiology and Performance 5(3): 276–291.',
      url: 'https://doi.org/10.1123/ijspp.5.3.276',
    },
    {
      citation:
        'San-Millán I, Brooks GA (2018). Assessment of metabolic flexibility by means of measuring blood lactate, fat, and carbohydrate oxidation responses to exercise in professional endurance athletes and less-fit individuals. Sports Medicine 48(2): 467–479.',
      url: 'https://doi.org/10.1007/s40279-017-0751-x',
    },
    {
      citation:
        'Karvonen MJ, Kentala E, Mustala O (1957). The effects of training on heart rate; a longitudinal study. Annales Medicinae Experimentalis et Biologiae Fenniae 35(3): 307–315.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/13470504/',
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

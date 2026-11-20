import type { LearnTerm } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentNl } from './nl';
import { ContentPl } from './pl';
import { ContentPtBr } from './pt-br';

export const kmEffort: LearnTerm = {
  slug: 'km-effort',
  theme: 'racing',
  name: {
    en: 'Km-effort',
    fr: 'Kilomètre-effort',
    es: 'Kilómetro-esfuerzo',
    it: 'Km-sforzo',
    'pt-br': 'Km-esforço',
    de: 'Km-Effort',
    pl: 'Km-effort',
    nl: 'Km-effort',
  },
  title: {
    en: 'Km-effort: definition, formula, example',
    fr: 'Qu’est-ce que le km-effort ? Définition, formule, exemple',
    es: '¿Qué es el km-esfuerzo? Definición, fórmula y ejemplo',
    it: 'Cos’è il km-sforzo? Definizione, formula, esempio',
    'pt-br': 'O que é km-esforço? Definição, fórmula e exemplo',
    de: 'Km-Effort (Leistungskilometer): Definition, Formel, Beispiel',
    pl: 'Czym jest km-effort (kilometr wysiłkowy)? Definicja, wzór',
    nl: 'Wat is km-effort (inspanningskilometer)? Definitie, formule',
  },
  description: {
    en: 'Km-effort adds climbing to distance: km + D+/100. How to calculate it, a trail race time prediction with Riegel’s formula, and where it misleads.',
    fr: 'Le km-effort ajoute le dénivelé à la distance : km + D+/100. Le calcul, une prédiction de temps en trail avec la formule de Riegel et ses limites.',
    es: 'El km-esfuerzo suma el desnivel a la distancia: km + D+/100. Cómo calcularlo, una predicción de tiempo en trail con Riegel y sus límites.',
    it: 'Il km-sforzo somma il dislivello alla distanza: km + D+/100. Come calcolarlo, una previsione del tempo nel trail con Riegel e i suoi limiti.',
    'pt-br':
      'O km-esforço soma a subida à distância: km + D+/100. Como calcular, uma previsão de tempo de trail com a fórmula de Riegel e os limites.',
    de: 'Km-Effort rechnet Höhenmeter in die Distanz ein: km + Hm/100. So berechnest du ihn, Trail-Zielzeit mit der Riegel-Formel und wo er täuscht.',
    pl: 'Km-effort wlicza przewyższenie w dystans: km + D+/100. Jak go policzyć, czas biegu górskiego ze wzoru Riegela i kiedy wprowadza w błąd.',
    nl: 'Km-effort rekent hoogtemeters om naar afstand: km + D+/100. Zo bereken je het, een trailtijd met de formule van Riegel, en waar het misleidt.',
  },
  definition: {
    en: 'Km-effort is a trail running measure of course difficulty that adds one kilometre for every 100 metres of ascent: km-effort = distance in km + D+ in metres / 100.',
    fr: 'Le kilomètre-effort est une mesure de la difficulté d’un parcours de trail qui ajoute un kilomètre par tranche de 100 mètres de dénivelé positif : km-effort = distance en km + D+ en mètres / 100.',
    es: 'El kilómetro-esfuerzo es una medida de la dificultad de un recorrido de trail que suma un kilómetro por cada 100 metros de desnivel positivo: km-esfuerzo = distancia en km + D+ en metros / 100.',
    it: 'Il km-sforzo è una misura della difficoltà di un percorso trail che aggiunge un chilometro ogni 100 metri di dislivello positivo: km-sforzo = distanza in km + D+ in metri / 100.',
    'pt-br':
      'O km-esforço é uma medida da dificuldade de um percurso de trail que soma um quilômetro a cada 100 metros de ganho de elevação: km-esforço = distância em km + D+ em metros / 100.',
    de: 'Km-Effort ist im Trailrunning ein Maß für die Schwierigkeit einer Strecke, das für je 100 Höhenmeter im Anstieg einen Kilometer addiert: km-Effort = Distanz in km + Höhenmeter in m / 100.',
    pl: 'Km-effort to miara trudności trasy w biegach górskich, która za każde 100 metrów przewyższenia dodaje jeden kilometr: km-effort = dystans w km + przewyższenie w m / 100.',
    nl: 'Km-effort is een maat voor de zwaarte van een trailparcours die voor elke 100 hoogtemeters stijging één kilometer optelt: km-effort = afstand in km + hoogtemeters in m / 100.',
  },
  aliases: {
    en: ['Kilometre-effort', 'Effort kilometres', 'km-e'],
    fr: ['Km-effort', 'Kilomètres-effort', 'km-e'],
    es: ['Km-esfuerzo', 'Kilómetros-esfuerzo', 'km-e'],
    it: ['Chilometro-sforzo', 'Km-effort'],
    'pt-br': ['Quilômetro-esforço', 'Km-effort'],
    de: ['Leistungskilometer', 'Kilometer-Effort', 'km-e'],
    pl: ['Kilometr wysiłkowy', 'Kilometry wysiłkowe', 'Km-wysiłek', 'km-e'],
    nl: ['Inspanningskilometer', 'Kilometer-effort', 'Effortkilometer', 'km-e'],
  },
  faq: {
    en: [
      {
        question: 'Does km-effort count the descent?',
        answer:
          'No. The usual formula only adds the ascent: km + D+ / 100. Descents give neither credit nor penalty, which is its main weakness on courses with long, steep downhills.',
      },
      {
        question: 'Is km-effort the same as the ITRA or UTMB index?',
        answer:
          'No. ITRA uses the same sum of distance plus D+ / 100 to classify races, but the ITRA performance index and the UTMB Index are scores of runners, built on their own models. Km-effort only describes a course.',
      },
      {
        question: 'What is a good pace per km-effort?',
        answer:
          'It depends on the terrain and the length of the race. Use it to compare yourself on similar courses: if your pace per km-effort drops over a training block on comparable terrain, your trail fitness is improving.',
      },
    ],
    fr: [
      {
        question: 'Le km-effort tient-il compte de la descente ?',
        answer:
          'Non. La formule courante n’ajoute que la montée : km + D+ / 100. La descente n’apporte ni bonus ni pénalité, ce qui est sa principale faiblesse sur les parcours aux longues descentes raides.',
      },
      {
        question:
          'Le km-effort est-il la même chose que la cote ITRA ou l’UTMB Index ?',
        answer:
          'Non. L’ITRA utilise la même somme, distance plus D+ / 100, pour classer les courses, mais la cote de performance ITRA et l’UTMB Index notent des coureurs, avec leurs propres modèles. Le km-effort ne décrit qu’un parcours.',
      },
      {
        question: 'Qu’est-ce qu’une bonne allure au km-effort ?',
        answer:
          'Cela dépend du terrain et de la longueur de la course. Servez-vous-en pour vous comparer à vous-même sur des parcours semblables : si votre allure au km-effort baisse au fil d’un bloc sur des terrains comparables, votre forme en trail progresse.',
      },
    ],
    es: [
      {
        question: '¿El km-esfuerzo tiene en cuenta la bajada?',
        answer:
          'No. La fórmula habitual solo suma la subida: km + D+ / 100. Las bajadas no suman ni restan, y esa es su principal debilidad en recorridos con bajadas largas y empinadas.',
      },
      {
        question: '¿El km-esfuerzo es lo mismo que el índice ITRA o UTMB?',
        answer:
          'No. La ITRA usa la misma suma, distancia más D+ / 100, para clasificar carreras, pero el índice de rendimiento ITRA y el UTMB Index puntúan a corredores con sus propios modelos. El km-esfuerzo solo describe un recorrido.',
      },
      {
        question: '¿Qué es un buen ritmo por km-esfuerzo?',
        answer:
          'Depende del terreno y de la duración de la carrera. Úsalo para compararte contigo en recorridos parecidos: si tu ritmo por km-esfuerzo baja a lo largo de un bloque en terrenos similares, tu forma en trail está mejorando.',
      },
    ],
    it: [
      {
        question: 'Il km-sforzo tiene conto della discesa?',
        answer:
          'No. La formula più usata somma solo la salita: km + D+ / 100. Le discese non danno né bonus né penalità, ed è il suo limite principale sui percorsi con discese lunghe e ripide.',
      },
      {
        question: 'Il km-sforzo è la stessa cosa dell’indice ITRA o UTMB?',
        answer:
          'No. L’ITRA usa la stessa somma, distanza più D+ / 100, per classificare le gare, ma l’indice di performance ITRA e l’UTMB Index danno un punteggio ai corridori con modelli propri. Il km-sforzo descrive solo un percorso.',
      },
      {
        question: 'Qual è un buon passo per km-sforzo?',
        answer:
          'Dipende dal terreno e dalla lunghezza della gara. Usalo per confrontarti con te stesso su percorsi simili: se il tuo passo per km-sforzo scende nel corso di un blocco su terreni paragonabili, la tua forma nel trail sta migliorando.',
      },
    ],
    'pt-br': [
      {
        question: 'O km-esforço leva em conta a descida?',
        answer:
          'Não. A fórmula mais comum só soma a subida: km + D+ / 100. As descidas não somam nem tiram, e esse é o principal ponto fraco em percursos com descidas longas e íngremes.',
      },
      {
        question: 'O km-esforço é a mesma coisa que o índice ITRA ou UTMB?',
        answer:
          'Não. A ITRA usa a mesma soma, distância mais D+ / 100, para classificar provas, mas o índice de performance ITRA e o UTMB Index pontuam corredores com modelos próprios. O km-esforço só descreve um percurso.',
      },
      {
        question: 'Qual é um bom pace por km-esforço?',
        answer:
          'Depende do terreno e da duração da prova. Use-o para se comparar com você mesmo em percursos parecidos: se o seu pace por km-esforço cai ao longo de um bloco em terrenos semelhantes, o seu condicionamento no trail está melhorando.',
      },
    ],
    de: [
      {
        question: 'Berücksichtigt der Km-Effort den Abstieg?',
        answer:
          'Nein. Die gängige Formel rechnet nur den Anstieg dazu: km + D+ / 100. Abstiege bringen weder Bonus noch Abzug, und das ist ihre größte Schwäche auf Strecken mit langen, steilen Abstiegen.',
      },
      {
        question: 'Ist der Km-Effort dasselbe wie der ITRA- oder UTMB-Index?',
        answer:
          'Nein. Die ITRA verwendet dieselbe Summe, Distanz plus D+ / 100, um Rennen einzustufen, aber der ITRA-Leistungsindex und der UTMB Index bewerten Läufer, mit eigenen Modellen. Der Km-Effort beschreibt nur eine Strecke.',
      },
      {
        question: 'Was ist eine gute Pace pro km-Effort?',
        answer:
          'Das hängt vom Gelände und von der Länge des Rennens ab. Nutze sie, um dich auf ähnlichen Strecken mit dir selbst zu vergleichen: Sinkt deine Pace pro km-Effort im Lauf eines Trainingsblocks auf vergleichbarem Terrain, wird deine Trailform besser.',
      },
    ],
    pl: [
      {
        question: 'Czy km-effort uwzględnia zbiegi?',
        answer:
          'Nie. Typowy wzór dodaje tylko przewyższenie: km + D+ / 100. Zbiegi nie dają ani premii, ani kary, co jest jego główną słabością na trasach z długimi, stromymi zbiegami.',
      },
      {
        question: 'Czy km-effort to to samo co indeks ITRA lub UTMB?',
        answer:
          'Nie. ITRA używa tej samej sumy dystansu i D+ / 100 do klasyfikowania biegów, ale indeks wydajności ITRA i UTMB Index to oceny biegaczy oparte na własnych modelach. Km-effort opisuje tylko trasę.',
      },
      {
        question: 'Jakie tempo na km-effort jest dobre?',
        answer:
          'Zależy od terenu i długości biegu. Używaj go do porównywania się ze sobą na podobnych trasach: jeśli Twoje tempo na km-effort spada w trakcie bloku treningowego na porównywalnym terenie, Twoja forma w górach rośnie.',
      },
    ],
    nl: [
      {
        question: 'Telt km-effort de afdaling mee?',
        answer:
          'Nee. De gangbare formule telt alleen de stijging op: km + D+ / 100. Afdalingen leveren geen bonus en geen straf op, en dat is de grootste zwakte op parcoursen met lange, steile afdalingen.',
      },
      {
        question: 'Is km-effort hetzelfde als de ITRA- of UTMB-index?',
        answer:
          'Nee. ITRA gebruikt dezelfde som van afstand plus D+ / 100 om wedstrijden in te delen, maar de ITRA-prestatie-index en de UTMB Index zijn scores van lopers, gebouwd op eigen modellen. Km-effort beschrijft alleen een parcours.',
      },
      {
        question: 'Wat is een goed tempo per km-effort?',
        answer:
          'Dat hangt af van het terrein en de lengte van de wedstrijd. Gebruik het om jezelf te vergelijken op soortgelijke parcoursen: daalt je tempo per km-effort tijdens een trainingsblok op vergelijkbaar terrein, dan gaat je trailconditie vooruit.',
      },
    ],
  },
  related: ['grade-adjusted-pace', 'negative-split', 'critical-speed', 'vma'],
  links: [
    '/tools/trail-time-estimator',
    '/training-plans/trail',
    '/tools/grade-adjusted-pace',
  ],
  sources: [
    {
      citation:
        'Riegel PS (1981). Athletic records and human endurance. American Scientist 69(3): 285–290.',
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
    pl: ContentPl,
    nl: ContentNl,
  },
};

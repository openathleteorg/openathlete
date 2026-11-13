import type { LearnTerm } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const ctlAtlTsb: LearnTerm = {
  slug: 'ctl-atl-tsb',
  theme: 'load',
  name: {
    en: 'CTL, ATL and TSB',
    fr: 'CTL, ATL et TSB',
    es: 'CTL, ATL y TSB',
    it: 'CTL, ATL e TSB',
    'pt-br': 'CTL, ATL e TSB',
    de: 'CTL, ATL und TSB',
  },
  title: {
    en: 'CTL, ATL and TSB: definition, formula, example',
    fr: 'Que sont CTL, ATL et TSB\u00a0? Définition, formule, exemple',
    es: '¿Qué son CTL, ATL y TSB? Definición, fórmula y ejemplo',
    it: 'Cosa sono CTL, ATL e TSB? Definizione, formula, esempio',
    'pt-br': 'O que são CTL, ATL e TSB? Definição, fórmula e exemplo',
    de: 'Was sind CTL, ATL und TSB? Definition, Formel, Beispiel',
  },
  description: {
    en: 'Fitness (CTL), fatigue (ATL) and form (TSB) explained: Banister’s model, the 42- and 7-day time constants, a worked example and how to read the curves.',
    fr: 'Forme (CTL), fatigue (ATL) et fraîcheur (TSB)\u00a0: le modèle de Banister, les constantes de 42 et 7 jours, un exemple chiffré et la lecture des courbes.',
    es: 'Forma física (CTL), fatiga (ATL) y frescura (TSB): el modelo de Banister, las constantes de 42 y 7 días, un ejemplo con números y cómo leer las curvas.',
    it: 'Forma (CTL), fatica (ATL) e freschezza (TSB): il modello di Banister, le costanti di 42 e 7 giorni, un esempio con i numeri e come leggere le curve.',
    'pt-br':
      'Condicionamento (CTL), fadiga (ATL) e forma (TSB): o modelo de Banister, as constantes de 42 e 7 dias, um exemplo com contas e como ler as curvas.',
    de: 'Fitness (CTL), Ermüdung (ATL) und Form (TSB) erklärt: Banisters Modell, die Zeitkonstanten 42 und 7 Tage, ein Rechenbeispiel und das Lesen der Kurven.',
  },
  definition: {
    en: 'CTL (fitness) and ATL (fatigue) are exponentially weighted averages of daily training load over about 42 and 7 days, and TSB (form) is the difference between them, CTL minus ATL.',
    fr: 'La CTL (forme) et l’ATL (fatigue) sont des moyennes pondérées exponentiellement de la charge d’entraînement quotidienne sur environ 42 et 7 jours, et la TSB (fraîcheur) est leur différence, CTL moins ATL.',
    es: 'La CTL (forma física) y la ATL (fatiga) son medias ponderadas exponencialmente de la carga de entrenamiento diaria sobre unos 42 y 7 días, y la TSB (frescura) es su diferencia, CTL menos ATL.',
    it: 'La CTL (forma) e l’ATL (fatica) sono medie pesate esponenzialmente del carico di allenamento giornaliero su circa 42 e 7 giorni, e la TSB (freschezza) è la loro differenza, CTL meno ATL.',
    'pt-br':
      'A CTL (condicionamento) e a ATL (fadiga) são médias com peso exponencial da carga de treino diária ao longo de cerca de 42 e 7 dias, e a TSB (forma) é a diferença entre elas, CTL menos ATL.',
    de: 'CTL (Fitness) und ATL (Ermüdung) sind exponentiell gewichtete Mittelwerte der täglichen Trainingsbelastung über etwa 42 bzw. 7 Tage, und die TSB (Form) ist ihre Differenz, CTL minus ATL.',
  },
  aliases: {
    en: [
      'Fitness, fatigue and form',
      'Chronic training load',
      'Acute training load',
      'Training stress balance',
      'Fitness-fatigue model',
    ],
    fr: [
      'Forme, fatigue et fraîcheur',
      'Charge chronique',
      'Charge aiguë',
      'Modèle forme-fatigue',
    ],
    es: [
      'Forma física, fatiga y frescura',
      'Carga crónica',
      'Carga aguda',
      'Modelo forma-fatiga',
    ],
    it: [
      'Forma, fatica e freschezza',
      'Carico cronico',
      'Carico acuto',
      'Modello forma-fatica',
    ],
    'pt-br': [
      'Condicionamento, fadiga e forma',
      'Carga crônica',
      'Carga aguda',
      'Modelo condicionamento-fadiga',
    ],
    de: [
      'Fitness, Ermüdung und Form',
      'Chronische Trainingsbelastung',
      'Akute Trainingsbelastung',
      'Training Stress Balance',
      'Fitness-Ermüdungs-Modell',
    ],
  },
  faq: {
    en: [
      {
        question: 'What is a good TSB before a race?',
        answer:
          'There is no universal value. Many athletes race well with a TSB between slightly negative and clearly positive, but the right number is personal. Note your TSB before each race and compare it with how the race went.',
      },
      {
        question: 'How fast should CTL go up?',
        answer:
          'Gradually. A rise of a few points per week during a build is common; much faster usually means a jump in volume or intensity that deserves a second look. The model gives no safe limit: how you respond, your sleep and any niggles matter more.',
      },
      {
        question: 'Why is my CTL different in another app?',
        answer:
          'Apps use different load scores (TRIMP, power-based TSS, pace-based scores), different daily weights (1 − e^(−1/τ) or the shortcut 2 / (N + 1)) and take TSB on the same day or the day before. The trend is comparable; the absolute numbers are not.',
      },
    ],
    fr: [
      {
        question: 'Quelle TSB viser avant une course\u00a0?',
        answer:
          'Il n’existe pas de valeur universelle. Beaucoup d’athlètes courent bien avec une TSB entre légèrement négative et nettement positive, mais le bon chiffre est personnel. Notez votre TSB avant chaque course et comparez-la avec le résultat.',
      },
      {
        question: 'À quel rythme la CTL doit-elle monter\u00a0?',
        answer:
          'Progressivement. Une hausse de quelques points par semaine pendant un bloc est courante\u00a0; bien plus vite, c’est en général un saut de volume ou d’intensité qui mérite d’être vérifié. Le modèle ne donne aucune limite sûre\u00a0: votre réponse, votre sommeil et vos petites douleurs comptent davantage.',
      },
      {
        question:
          'Pourquoi ma CTL est-elle différente dans une autre application\u00a0?',
        answer:
          'Les applications utilisent des scores de charge différents (TRIMP, TSS basé sur la puissance, scores basés sur l’allure), des poids quotidiens différents (1 − e^(−1/τ) ou le raccourci 2 / (N + 1)) et calculent la TSB le jour même ou la veille. La tendance est comparable, pas les chiffres absolus.',
      },
    ],
    es: [
      {
        question: '¿Qué TSB conviene tener antes de una carrera?',
        answer:
          'No hay un valor universal. Muchos atletas compiten bien con una TSB entre ligeramente negativa y claramente positiva, pero la cifra buena es personal. Apunta tu TSB antes de cada carrera y compárala con cómo te fue.',
      },
      {
        question: '¿A qué ritmo debería subir la CTL?',
        answer:
          'Poco a poco. Subir unos puntos por semana durante un bloque es habitual; mucho más rápido suele indicar un salto de volumen o intensidad que conviene revisar. El modelo no da ningún límite seguro: tu respuesta, tu sueño y las molestias pesan más.',
      },
      {
        question: '¿Por qué mi CTL es distinta en otra aplicación?',
        answer:
          'Cada aplicación usa su propia puntuación de carga (TRIMP, TSS por potencia, puntuaciones por ritmo), un peso diario distinto (1 − e^(−1/τ) o el atajo 2 / (N + 1)) y calcula la TSB el mismo día o el anterior. La tendencia es comparable; las cifras absolutas, no.',
      },
    ],
    it: [
      {
        question: 'Che TSB avere prima di una gara?',
        answer:
          'Non esiste un valore universale. Molti atleti gareggiano bene con una TSB tra leggermente negativa e chiaramente positiva, ma il numero giusto è personale. Annota la TSB prima di ogni gara e confrontala con com’è andata.',
      },
      {
        question: 'Quanto velocemente dovrebbe salire la CTL?',
        answer:
          'Gradualmente. Qualche punto a settimana durante un blocco è normale; molto più in fretta di solito vuol dire un salto di volume o intensità da ricontrollare. Il modello non dà limiti sicuri: contano di più la tua risposta, il sonno e i piccoli fastidi.',
      },
      {
        question: 'Perché la mia CTL è diversa in un’altra app?',
        answer:
          'Ogni app usa un suo punteggio di carico (TRIMP, TSS da potenza, punteggi da ritmo), un peso giornaliero diverso (1 − e^(−1/τ) o la scorciatoia 2 / (N + 1)) e calcola la TSB nello stesso giorno o in quello prima. L’andamento è confrontabile, i numeri assoluti no.',
      },
    ],
    'pt-br': [
      {
        question: 'Qual TSB ter antes de uma prova?',
        answer:
          'Não existe valor universal. Muitos atletas correm bem com uma TSB entre levemente negativa e claramente positiva, mas o número certo é pessoal. Anote sua TSB antes de cada prova e compare com o resultado.',
      },
      {
        question: 'Em que ritmo a CTL deve subir?',
        answer:
          'Aos poucos. Subir alguns pontos por semana durante um bloco é comum; muito mais rápido costuma indicar um salto de volume ou intensidade que vale revisar. O modelo não dá nenhum limite seguro: a sua resposta, o seu sono e os incômodos pesam mais.',
      },
      {
        question: 'Por que minha CTL é diferente em outro aplicativo?',
        answer:
          'Cada aplicativo usa a sua pontuação de carga (TRIMP, TSS por potência, pontuações por pace), um peso diário diferente (1 − e^(−1/τ) ou o atalho 2 / (N + 1)) e calcula a TSB no mesmo dia ou no dia anterior. A tendência é comparável; os números absolutos, não.',
      },
    ],
    de: [
      {
        question: 'Welche TSB ist vor einem Wettkampf gut?',
        answer:
          'Es gibt keinen allgemeingültigen Wert. Viele Athleten laufen gute Wettkämpfe mit einer TSB zwischen leicht negativ und deutlich positiv, aber der richtige Wert ist individuell. Notiere deine TSB vor jedem Wettkampf und vergleiche sie mit dem Ergebnis.',
      },
      {
        question: 'Wie schnell sollte die CTL steigen?',
        answer:
          'Allmählich. Ein Anstieg um ein paar Punkte pro Woche in einer Aufbauphase ist üblich; deutlich schneller bedeutet meist einen Sprung bei Umfang oder Intensität, den du genauer anschauen solltest. Das Modell nennt keine sichere Grenze: Wie du reagierst, dein Schlaf und kleine Wehwehchen zählen mehr.',
      },
      {
        question: 'Warum ist meine CTL in einer anderen App anders?',
        answer:
          'Apps verwenden unterschiedliche Belastungswerte (TRIMP, leistungsbasierter TSS, pacebasierte Werte), unterschiedliche Tagesgewichte (1 − e^(−1/τ) oder die Abkürzung 2 / (N + 1)) und berechnen die TSB am selben Tag oder am Vortag. Der Trend ist vergleichbar, die absoluten Zahlen sind es nicht.',
      },
    ],
  },
  related: ['trimp', 'session-rpe', 'taper', 'hrv'],
  links: [
    '/features/training-load',
    '/blog/what-is-trimp-and-how-to-use-it',
    '/blog/5-signs-of-overtraining-and-how-to-avoid-it',
    '/blog/progressive-overload-increasing-intensity-without-breaking',
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
        'Clarke DC, Skiba PF (2013). Rationale and resources for teaching the mathematical modeling of athletic training and performance. Advances in Physiology Education 37(2): 134–152.',
      url: 'https://doi.org/10.1152/advan.00078.2011',
    },
    {
      citation:
        'Hellard P, Avalos M, Lacoste L, et al. (2006). Assessing the limitations of the Banister model in monitoring training. Journal of Sports Sciences 24(5): 509–520.',
      url: 'https://doi.org/10.1080/02640410500244697',
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

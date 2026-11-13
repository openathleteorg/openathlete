import type { LearnTerm } from '../types';
import { ContentDe } from './de';
import { ContentEn } from './en';
import { ContentEs } from './es';
import { ContentFr } from './fr';
import { ContentIt } from './it';
import { ContentPtBr } from './pt-br';

export const aerobicDecoupling: LearnTerm = {
  slug: 'aerobic-decoupling',
  theme: 'intensity',
  name: {
    en: 'Aerobic decoupling',
    fr: 'Découplage aérobie',
    es: 'Desacoplamiento aeróbico',
    it: 'Disaccoppiamento aerobico',
    'pt-br': 'Desacoplamento aeróbico',
    de: 'Aerobe Entkopplung',
  },
  title: {
    en: 'Aerobic decoupling: definition, formula, example',
    fr: 'Qu’est-ce que le découplage aérobie ? Définition et formule',
    es: '¿Qué es el desacoplamiento aeróbico? Definición y fórmula',
    it: 'Cos’è il disaccoppiamento aerobico? Definizione e formula',
    'pt-br': 'O que é desacoplamento aeróbico? Definição, fórmula e exemplo',
    de: 'Aerobe Entkopplung: Definition, Formel und Beispiel',
  },
  description: {
    en: 'Aerobic decoupling (Pa:HR, Pw:HR) measures how heart rate drifts against pace or power over a steady effort. Formula, the 5% rule and a worked example.',
    fr: 'Le découplage aérobie (Pa:HR, Pw:HR) mesure la dérive du cardio face à l’allure ou à la puissance sur un effort régulier. Formule, seuil de 5 %, exemple.',
    es: 'El desacoplamiento aeróbico (Pa:HR, Pw:HR) mide la deriva del pulso frente al ritmo o la potencia en esfuerzos continuos. Fórmula, umbral del 5 %, ejemplo.',
    it: 'Il disaccoppiamento aerobico (Pa:HR, Pw:HR) misura la deriva del cuore rispetto a passo o potenza in uno sforzo costante. Formula, soglia del 5%, esempio.',
    'pt-br':
      'O desacoplamento aeróbico (Pa:HR, Pw:HR) mede quanto a frequência cardíaca deriva em relação ao pace ou à potência num esforço contínuo. Fórmula e exemplo.',
    de: 'Die aerobe Entkopplung (Pa:HR, Pw:HR) misst die Herzfrequenzdrift gegenüber Pace oder Leistung bei gleichmäßiger Belastung. Formel, 5-%-Regel, Beispiel.',
  },
  definition: {
    en: 'Aerobic decoupling is the percentage by which your output per heartbeat (pace or power divided by heart rate) falls from the first half to the second half of a steady effort, used as a marker of aerobic endurance.',
    fr: 'Le découplage aérobie est le pourcentage de baisse de votre rendement par battement (allure ou puissance divisée par la fréquence cardiaque) entre la première et la seconde moitié d’un effort régulier, utilisé comme indicateur d’endurance aérobie.',
    es: 'El desacoplamiento aeróbico es el porcentaje en que cae tu rendimiento por latido (ritmo o potencia dividido por el pulso) entre la primera y la segunda mitad de un esfuerzo continuo, y se usa como indicador de resistencia aeróbica.',
    it: 'Il disaccoppiamento aerobico è la percentuale di cui cala il tuo rendimento per battito (passo o potenza divisi per la frequenza cardiaca) tra la prima e la seconda metà di uno sforzo costante, usata come indicatore di resistenza aerobica.',
    'pt-br':
      'O desacoplamento aeróbico é a porcentagem em que o seu rendimento por batimento (pace ou potência dividido pela frequência cardíaca) cai da primeira para a segunda metade de um esforço contínuo, usada como indicador de resistência aeróbica.',
    de: 'Die aerobe Entkopplung ist der prozentuale Rückgang deines Outputs pro Herzschlag (Pace oder Leistung geteilt durch Herzfrequenz) von der ersten zur zweiten Hälfte einer gleichmäßigen Belastung. Sie dient als Marker für die aerobe Ausdauer.',
  },
  aliases: {
    en: ['Pa:HR', 'Pw:HR', 'Cardiac drift', 'Heart rate drift'],
    fr: ['Pa:HR', 'Pw:HR', 'Dérive cardiaque'],
    es: ['Pa:HR', 'Pw:HR', 'Deriva cardíaca'],
    it: ['Pa:HR', 'Pw:HR', 'Deriva cardiaca'],
    'pt-br': ['Pa:HR', 'Pw:HR', 'Deriva cardíaca'],
    de: ['Pa:HR', 'Pw:HR', 'Kardiale Drift', 'Herzfrequenzdrift'],
  },
  faq: {
    en: [
      {
        question: 'What is a good aerobic decoupling percentage?',
        answer:
          'Under 5% on a long steady run or ride is the usual sign that your aerobic endurance covers that duration at that intensity. Between 5% and 10% shows some drift; above 10%, the effort was too long, too hard or too hot for your current fitness.',
      },
      {
        question: 'Should I measure decoupling on an interval session?',
        answer:
          'No. Decoupling compares two halves of the same steady effort. Intervals, hilly runs with stops or a fartlek mix intensities, and the result says more about the session structure than about your endurance. Use a steady run or ride of at least 20 minutes, ideally an hour or more.',
      },
      {
        question: 'Why does my heart rate drift up even at an easy pace?',
        answer:
          'Over long efforts, rising body temperature pushes heart rate up while the volume of blood pumped per beat falls, and fluid loss adds to it. Heat, dehydration and a lack of endurance make the drift larger.',
      },
    ],
    fr: [
      {
        question: 'Quel pourcentage de découplage est bon ?',
        answer:
          'Moins de 5 % sur une sortie longue régulière, à pied ou à vélo, indique en général que votre endurance aérobie couvre cette durée à cette intensité. Entre 5 et 10 %, il y a une dérive ; au-delà de 10 %, l’effort était trop long, trop intense ou trop chaud pour votre niveau actuel.',
      },
      {
        question:
          'Peut-on mesurer le découplage sur une séance de fractionné ?',
        answer:
          'Non. Le découplage compare deux moitiés d’un même effort régulier. Le fractionné, un parcours vallonné avec des arrêts ou un fartlek mélangent les intensités, et le résultat reflète la structure de la séance plus que votre endurance. Prenez une sortie régulière d’au moins 20 minutes, idéalement une heure ou plus.',
      },
      {
        question:
          'Pourquoi mon cardio dérive-t-il même en endurance fondamentale ?',
        answer:
          'Sur un effort long, la hausse de la température corporelle fait monter la fréquence cardiaque pendant que le volume de sang éjecté à chaque battement diminue, et la perte d’eau s’y ajoute. La chaleur, la déshydratation et un manque d’endurance accentuent la dérive.',
      },
    ],
    es: [
      {
        question: '¿Qué porcentaje de desacoplamiento es bueno?',
        answer:
          'Por debajo del 5 % en una tirada o salida larga y continua suele indicar que tu resistencia aeróbica cubre esa duración a esa intensidad. Entre el 5 y el 10 % hay cierta deriva; por encima del 10 %, el esfuerzo fue demasiado largo, intenso o caluroso para tu forma actual.',
      },
      {
        question: '¿Se puede medir el desacoplamiento en una sesión de series?',
        answer:
          'No. El desacoplamiento compara dos mitades de un mismo esfuerzo continuo. Las series, un recorrido con cuestas y paradas o un fartlek mezclan intensidades, y el resultado habla más de la estructura de la sesión que de tu resistencia. Usa una salida continua de al menos 20 minutos, idealmente una hora o más.',
      },
      {
        question: '¿Por qué sube el pulso incluso a ritmo suave?',
        answer:
          'En esfuerzos largos, el aumento de la temperatura corporal sube el pulso mientras baja el volumen de sangre que el corazón bombea en cada latido, y la pérdida de líquidos se suma. El calor, la deshidratación y la falta de fondo agrandan la deriva.',
      },
    ],
    it: [
      {
        question: 'Qual è una buona percentuale di disaccoppiamento?',
        answer:
          'Sotto il 5% in un lungo costante, di corsa o in bici, di solito indica che la tua resistenza aerobica copre quella durata a quell’intensità. Tra il 5 e il 10% c’è un po’ di deriva; sopra il 10% lo sforzo era troppo lungo, troppo intenso o troppo caldo per la tua forma attuale.',
      },
      {
        question:
          'Si può misurare il disaccoppiamento su una seduta di ripetute?',
        answer:
          'No. Il disaccoppiamento confronta due metà dello stesso sforzo costante. Ripetute, percorsi collinari con soste o fartlek mescolano le intensità, e il risultato dice più della struttura della seduta che della tua resistenza. Usa un’uscita costante di almeno 20 minuti, meglio un’ora o più.',
      },
      {
        question: 'Perché il cuore sale anche a ritmo facile?',
        answer:
          'Negli sforzi lunghi l’aumento della temperatura corporea fa salire la frequenza cardiaca mentre cala il volume di sangue pompato a ogni battito, e la perdita di liquidi si aggiunge. Caldo, disidratazione e poca resistenza aumentano la deriva.',
      },
    ],
    'pt-br': [
      {
        question: 'Qual é uma boa porcentagem de desacoplamento?',
        answer:
          'Abaixo de 5% num longão ou pedal longo e contínuo costuma indicar que a sua resistência aeróbica cobre essa duração nessa intensidade. Entre 5% e 10% há alguma deriva; acima de 10%, o esforço foi longo, forte ou quente demais para o seu condicionamento atual.',
      },
      {
        question: 'Dá para medir o desacoplamento num treino de tiros?',
        answer:
          'Não. O desacoplamento compara duas metades do mesmo esforço contínuo. Tiros, percursos com subidas e paradas ou fartlek misturam intensidades, e o resultado fala mais da estrutura do treino do que da sua resistência. Use um treino contínuo de pelo menos 20 minutos, de preferência uma hora ou mais.',
      },
      {
        question: 'Por que a frequência cardíaca sobe mesmo em ritmo leve?',
        answer:
          'Em esforços longos, o aumento da temperatura do corpo faz a frequência cardíaca subir enquanto o volume de sangue bombeado a cada batimento cai, e a perda de líquidos se soma a isso. Calor, desidratação e pouca base aeróbica aumentam a deriva.',
      },
    ],
    de: [
      {
        question: 'Welcher Wert für die aerobe Entkopplung ist gut?',
        answer:
          'Unter 5 % bei einem langen, gleichmäßigen Lauf oder einer langen Ausfahrt ist das übliche Zeichen dafür, dass deine aerobe Ausdauer diese Dauer bei dieser Intensität abdeckt. Zwischen 5 und 10 % zeigt sich eine gewisse Drift, über 10 % war die Belastung für deine aktuelle Form zu lang, zu hart oder zu heiß.',
      },
      {
        question: 'Kann ich die Entkopplung bei einer Intervalleinheit messen?',
        answer:
          'Nein. Die Entkopplung vergleicht zwei Hälften derselben gleichmäßigen Belastung. Intervalle, hügelige Läufe mit Stopps oder ein Fahrtspiel mischen Intensitäten, und das Ergebnis sagt mehr über den Aufbau der Einheit als über deine Ausdauer. Nimm einen gleichmäßigen Lauf oder eine Ausfahrt von mindestens 20 Minuten, idealerweise eine Stunde oder länger.',
      },
      {
        question: 'Warum steigt meine Herzfrequenz auch bei lockerem Tempo?',
        answer:
          'Bei langen Belastungen treibt die steigende Körpertemperatur die Herzfrequenz nach oben, während das pro Schlag gepumpte Blutvolumen sinkt, und der Flüssigkeitsverlust kommt hinzu. Hitze, Dehydrierung und fehlende Grundlagenausdauer verstärken die Drift.',
      },
    ],
  },
  related: ['trimp', 'hrv', 'vo2max', 'ctl-atl-tsb'],
  links: [
    '/tools/heart-rate-zones',
    '/tools/grade-adjusted-pace',
    '/features/training-load',
    '/blog/rpe-vs-heart-rate-why-your-heart-doesnt-tell-the-whole-story',
  ],
  sources: [
    {
      citation:
        'Coyle EF, González-Alonso J (2001). Cardiovascular drift during prolonged exercise: new perspectives. Exercise and Sport Sciences Reviews 29(2): 88–92.',
      url: 'https://doi.org/10.1097/00003677-200104000-00009',
    },
    {
      citation:
        'Friel J (2016). The Triathlete’s Training Bible, 4th edition. VeloPress.',
    },
    {
      citation:
        'Allen H, Coggan A (2010). Training and Racing with a Power Meter, 2nd edition. VeloPress.',
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

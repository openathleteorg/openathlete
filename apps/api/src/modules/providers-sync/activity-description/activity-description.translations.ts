import { Language } from 'src/common/constants/languages.constant';

import { WeatherSummary } from './activity-description.facts';

export type HeadlineMood =
  'pb' | 'hot' | 'cold' | 'rain' | 'snow' | 'long' | 'short' | 'default';

export type DescriptionTranslation = {
  /** BCP 47 locale for numbers: decimal comma or point */
  locale: string;
  headlines: Record<HeadlineMood, string[]>;
  sky: Record<WeatherSummary['sky'] | 'clear-night', string>;
  feelsLike: (t: string) => string;
  wind: (kmh: string) => string;
  gusts: (kmh: string) => string;
  humidity: (pct: string) => string;
  costsIntro: string;
  heat: string;
  cold: string;
  temperature: string;
  slope: string;
  altitude: string;
  normalizedPace: (normalized: string, actual: string) => string;
  intensity: string;
  easy: string;
  moderate: string;
  hard: string;
  decoupling: (pct: string) => string;
  decouplingSolid: string;
  decouplingFatigue: string;
  decouplingDeep: string;
  halfMarathon: string;
  marathon: string;
  personalBest: (label: string, value: string) => string;
  powerBest: (label: string, watts: string) => string;
  load: (trimp: string) => string;
  liberty: (n: string) => string;
  eiffel: (n: string) => string;
  everestPercent: (pct: string) => string;
  everestTimes: (n: string) => string;
  marathonPercent: (pct: string) => string;
  marathonFull: string;
  marathonTimes: (n: string) => string;
  pool: (n: string) => string;
  pizza: (n: string) => string;
  footer: string;
};

/**
 * Activity descriptions are public on Strava: the wording stays friendly,
 * gender-neutral and free of anything personal beyond the activity itself.
 */
export const descriptionTranslations: Record<Language, DescriptionTranslation> =
  {
    [Language.FR]: {
      locale: 'fr-FR',
      headlines: {
        pb: ['🏆 Journée record !', '🏆 Nouveau record perso, rien que ça !'],
        hot: ['🥵 Sortie sous la chaleur', '☀️ Ça chauffait aujourd’hui'],
        cold: [
          '🥶 Sortie dans le froid',
          '❄️ Il fallait du courage pour sortir',
        ],
        rain: [
          '🌧️ La pluie ? Même pas peur',
          '☔ La pluie n’a rien pu y faire',
        ],
        snow: ['🌨️ Sortie sous la neige', '❄️ Neige au programme, et alors ?'],
        long: [
          '🦾 Grosse sortie au compteur',
          '🏔️ Une longue de plus dans les jambes',
        ],
        short: ['⚡ Court mais efficace', '⚡ Format express'],
        default: [
          '✅ Une séance de plus à la banque',
          '💪 Bien joué pour cette sortie',
          '🔥 Encore une de faite',
        ],
      },
      sky: {
        clear: '☀️ Ciel dégagé',
        'clear-night': '🌙 Nuit claire',
        'partly-cloudy': '⛅ Éclaircies',
        cloudy: '☁️ Nuageux',
        rain: '🌧️ Pluie',
        snow: '🌨️ Neige',
      },
      feelsLike: (t) => `(ressenti ${t})`,
      wind: (kmh) => `💨 Vent ${kmh} km/h`,
      gusts: (kmh) => `(rafales ${kmh})`,
      humidity: (pct) => `💧 Humidité ${pct} %`,
      costsIntro: '⏱️ Ce que les conditions t’ont coûté :',
      heat: '🔥 chaleur',
      cold: '🥶 froid',
      temperature: '🌡️ température',
      slope: '⛰️ dénivelé',
      altitude: '🏔️ altitude',
      normalizedPace: (n, a) => `🎯 Allure normalisée : ${n} (réelle ${a})`,
      intensity: '🫀 Intensité',
      easy: 'facile',
      moderate: 'modéré',
      hard: 'intense',
      decoupling: (pct) => `🔋 Dérive cardiaque : ${pct} %`,
      decouplingSolid: 'endurance solide 💪',
      decouplingFatigue: 'un peu de fatigue en fin de sortie',
      decouplingDeep: 'grosse dérive, pense à bien récupérer 😮‍💨',
      halfMarathon: 'semi-marathon',
      marathon: 'marathon',
      personalBest: (label, value) => `🏅 Record perso — ${label} : ${value}`,
      powerBest: (label, watts) =>
        `🏅 Record de puissance — ${label} : ${watts} W`,
      load: (trimp) => `📈 Charge d’entraînement : ${trimp} TRIMP`,
      liberty: (n) => `🗽 Dénivelé : ${n}× la statue de la Liberté`,
      eiffel: (n) => `🗼 Dénivelé : ${n}× la tour Eiffel`,
      everestPercent: (pct) => `🏔️ Dénivelé : ${pct} % de l’Everest`,
      everestTimes: (n) => `🏔️ Dénivelé : ${n}× l’Everest 🤯`,
      marathonPercent: (pct) => `🏃 ${pct} % d’un marathon`,
      marathonFull: '🎉 La distance d’un marathon complet !',
      marathonTimes: (n) => `🏃 ${n}× la distance d’un marathon 🤯`,
      pool: (n) => `🏊 ${n} longueurs de bassin olympique`,
      pizza: (n) => `🍕 ≈ ${n} parts de pizza brûlées`,
      footer: '⚡ Analyse par OpenAthlete · openathlete.org',
    },
    [Language.EN]: {
      locale: 'en-GB',
      headlines: {
        pb: ['🏆 Record-breaking day!', '🏆 New personal best, no less!'],
        hot: ['🥵 Hot one out there', '☀️ A scorcher today'],
        cold: ['🥶 Braving the cold', '❄️ It took guts to get out today'],
        rain: ['🌧️ Rain? What rain?', '☔ The rain couldn’t stop you'],
        snow: ['🌨️ Out in the snow', '❄️ Snow day, showed up anyway'],
        long: ['🦾 Big day out', '🏔️ Another long one in the legs'],
        short: ['⚡ Short and sharp', '⚡ Quick and efficient'],
        default: [
          '✅ Another one in the bank',
          '💪 Nicely done',
          '🔥 One more done',
        ],
      },
      sky: {
        clear: '☀️ Clear sky',
        'clear-night': '🌙 Clear night',
        'partly-cloudy': '⛅ Partly cloudy',
        cloudy: '☁️ Cloudy',
        rain: '🌧️ Rain',
        snow: '🌨️ Snow',
      },
      feelsLike: (t) => `(feels like ${t})`,
      wind: (kmh) => `💨 Wind ${kmh} km/h`,
      gusts: (kmh) => `(gusts ${kmh})`,
      humidity: (pct) => `💧 Humidity ${pct}%`,
      costsIntro: '⏱️ What the conditions cost you:',
      heat: '🔥 heat',
      cold: '🥶 cold',
      temperature: '🌡️ temperature',
      slope: '⛰️ hills',
      altitude: '🏔️ altitude',
      normalizedPace: (n, a) => `🎯 Normalized pace: ${n} (actual ${a})`,
      intensity: '🫀 Intensity',
      easy: 'easy',
      moderate: 'moderate',
      hard: 'hard',
      decoupling: (pct) => `🔋 Cardiac drift: ${pct}%`,
      decouplingSolid: 'rock-solid endurance 💪',
      decouplingFatigue: 'some fatigue showing late on',
      decouplingDeep: 'big drift, recover well 😮‍💨',
      halfMarathon: 'half marathon',
      marathon: 'marathon',
      personalBest: (label, value) => `🏅 Personal best — ${label}: ${value}`,
      powerBest: (label, watts) => `🏅 Best power — ${label}: ${watts} W`,
      load: (trimp) => `📈 Training load: ${trimp} TRIMP`,
      liberty: (n) => `🗽 Climbing: ${n}× the Statue of Liberty`,
      eiffel: (n) => `🗼 Climbing: ${n}× the Eiffel Tower`,
      everestPercent: (pct) => `🏔️ Climbing: ${pct}% of Everest`,
      everestTimes: (n) => `🏔️ Climbing: ${n}× Everest 🤯`,
      marathonPercent: (pct) => `🏃 ${pct}% of a marathon`,
      marathonFull: '🎉 A full marathon distance!',
      marathonTimes: (n) => `🏃 ${n}× a marathon distance 🤯`,
      pool: (n) => `🏊 ${n} lengths of an Olympic pool`,
      pizza: (n) => `🍕 ≈ ${n} slices of pizza burned`,
      footer: '⚡ Analysis by OpenAthlete · openathlete.org',
    },
    [Language.IT]: {
      locale: 'it-IT',
      headlines: {
        pb: [
          '🏆 Giornata da record!',
          '🏆 Nuovo record personale, niente meno!',
        ],
        hot: ['🥵 Uscita sotto il caldo', '☀️ Oggi si scottava'],
        cold: ['🥶 Uscita al freddo', '❄️ Ci voleva coraggio per uscire oggi'],
        rain: [
          '🌧️ Pioggia? Quale pioggia?',
          '☔ Nemmeno la pioggia ti ha fermato',
        ],
        snow: ['🌨️ Uscita sotto la neve', '❄️ Neve in programma, e allora?'],
        long: ['🦾 Uscita lunga e tosta', '🏔️ Un altro lungo nelle gambe'],
        short: ['⚡ Breve ma intenso', '⚡ Formato express'],
        default: [
          '✅ Un altro allenamento in banca',
          '💪 Ben fatto',
          '🔥 Un altro fatto',
        ],
      },
      sky: {
        clear: '☀️ Cielo sereno',
        'clear-night': '🌙 Notte serena',
        'partly-cloudy': '⛅ Parzialmente nuvoloso',
        cloudy: '☁️ Nuvoloso',
        rain: '🌧️ Pioggia',
        snow: '🌨️ Neve',
      },
      feelsLike: (t) => `(percepita ${t})`,
      wind: (kmh) => `💨 Vento ${kmh} km/h`,
      gusts: (kmh) => `(raffiche ${kmh})`,
      humidity: (pct) => `💧 Umidità ${pct} %`,
      costsIntro: '⏱️ Quanto ti sono costate le condizioni:',
      heat: '🔥 caldo',
      cold: '🥶 freddo',
      temperature: '🌡️ temperatura',
      slope: '⛰️ dislivello',
      altitude: '🏔️ altitudine',
      normalizedPace: (n, a) => `🎯 Passo normalizzato: ${n} (reale ${a})`,
      intensity: '🫀 Intensità',
      easy: 'facile',
      moderate: 'moderata',
      hard: 'intensa',
      decoupling: (pct) => `🔋 Deriva cardiaca: ${pct} %`,
      decouplingSolid: 'resistenza solida 💪',
      decouplingFatigue: 'un po’ di fatica nel finale',
      decouplingDeep: 'deriva importante, recupera bene 😮‍💨',
      halfMarathon: 'mezza maratona',
      marathon: 'maratona',
      personalBest: (label, value) =>
        `🏅 Record personale — ${label}: ${value}`,
      powerBest: (label, watts) =>
        `🏅 Record di potenza — ${label}: ${watts} W`,
      load: (trimp) => `📈 Carico di allenamento: ${trimp} TRIMP`,
      liberty: (n) => `🗽 Dislivello: ${n}× la Statua della Libertà`,
      eiffel: (n) => `🗼 Dislivello: ${n}× la Torre Eiffel`,
      everestPercent: (pct) => `🏔️ Dislivello: ${pct} % dell’Everest`,
      everestTimes: (n) => `🏔️ Dislivello: ${n}× l’Everest 🤯`,
      marathonPercent: (pct) => `🏃 ${pct} % di una maratona`,
      marathonFull: '🎉 La distanza di una maratona intera!',
      marathonTimes: (n) => `🏃 ${n}× la distanza di una maratona 🤯`,
      pool: (n) => `🏊 ${n} vasche da piscina olimpionica`,
      pizza: (n) => `🍕 ≈ ${n} fette di pizza bruciate`,
      footer: '⚡ Analisi di OpenAthlete · openathlete.org',
    },
    [Language.ES]: {
      locale: 'es-ES',
      headlines: {
        pb: ['🏆 ¡Día de récord!', '🏆 ¡Nueva marca personal, ahí es nada!'],
        hot: ['🥵 Salida con calor', '☀️ Hoy apretaba el sol'],
        cold: ['🥶 Salida con frío', '❄️ Hacía falta valor para salir hoy'],
        rain: ['🌧️ ¿Lluvia? ¿Qué lluvia?', '☔ La lluvia no pudo contigo'],
        snow: ['🌨️ Salida bajo la nieve', '❄️ Nieve en el menú, ¿y qué?'],
        long: ['🦾 Salida de las grandes', '🏔️ Otra larga en las piernas'],
        short: ['⚡ Corto pero intenso', '⚡ Formato exprés'],
        default: [
          '✅ Un entrenamiento más en el banco',
          '💪 Bien hecho',
          '🔥 Uno más',
        ],
      },
      sky: {
        clear: '☀️ Despejado',
        'clear-night': '🌙 Noche despejada',
        'partly-cloudy': '⛅ Parcialmente nublado',
        cloudy: '☁️ Nublado',
        rain: '🌧️ Lluvia',
        snow: '🌨️ Nieve',
      },
      feelsLike: (t) => `(sensación ${t})`,
      wind: (kmh) => `💨 Viento ${kmh} km/h`,
      gusts: (kmh) => `(rachas ${kmh})`,
      humidity: (pct) => `💧 Humedad ${pct} %`,
      costsIntro: '⏱️ Lo que te costaron las condiciones:',
      heat: '🔥 calor',
      cold: '🥶 frío',
      temperature: '🌡️ temperatura',
      slope: '⛰️ desnivel',
      altitude: '🏔️ altitud',
      normalizedPace: (n, a) => `🎯 Ritmo normalizado: ${n} (real ${a})`,
      intensity: '🫀 Intensidad',
      easy: 'suave',
      moderate: 'moderada',
      hard: 'intensa',
      decoupling: (pct) => `🔋 Deriva cardíaca: ${pct} %`,
      decouplingSolid: 'resistencia sólida 💪',
      decouplingFatigue: 'algo de fatiga al final',
      decouplingDeep: 'deriva fuerte, recupera bien 😮‍💨',
      halfMarathon: 'media maratón',
      marathon: 'maratón',
      personalBest: (label, value) => `🏅 Marca personal — ${label}: ${value}`,
      powerBest: (label, watts) =>
        `🏅 Récord de potencia — ${label}: ${watts} W`,
      load: (trimp) => `📈 Carga de entrenamiento: ${trimp} TRIMP`,
      liberty: (n) => `🗽 Desnivel: ${n}× la Estatua de la Libertad`,
      eiffel: (n) => `🗼 Desnivel: ${n}× la Torre Eiffel`,
      everestPercent: (pct) => `🏔️ Desnivel: ${pct} % del Everest`,
      everestTimes: (n) => `🏔️ Desnivel: ${n}× el Everest 🤯`,
      marathonPercent: (pct) => `🏃 ${pct} % de un maratón`,
      marathonFull: '🎉 ¡La distancia de un maratón completo!',
      marathonTimes: (n) => `🏃 ${n}× la distancia de un maratón 🤯`,
      pool: (n) => `🏊 ${n} largos de piscina olímpica`,
      pizza: (n) => `🍕 ≈ ${n} porciones de pizza quemadas`,
      footer: '⚡ Análisis de OpenAthlete · openathlete.org',
    },
    [Language.PT_BR]: {
      locale: 'pt-BR',
      headlines: {
        pb: ['🏆 Dia de recorde!', '🏆 Novo recorde pessoal, nada menos!'],
        hot: ['🥵 Treino no calor', '☀️ Hoje o sol estava de rachar'],
        cold: ['🥶 Treino no frio', '❄️ Precisou de coragem para sair hoje'],
        rain: ['🌧️ Chuva? Que chuva?', '☔ Nem a chuva te segurou'],
        snow: ['🌨️ Treino na neve', '❄️ Neve no programa, e daí?'],
        long: ['🦾 Treino longo de respeito', '🏔️ Mais um longão nas pernas'],
        short: ['⚡ Curto e intenso', '⚡ Formato expresso'],
        default: [
          '✅ Mais um treino no banco',
          '💪 Mandou bem',
          '🔥 Mais um feito',
        ],
      },
      sky: {
        clear: '☀️ Céu limpo',
        'clear-night': '🌙 Noite limpa',
        'partly-cloudy': '⛅ Parcialmente nublado',
        cloudy: '☁️ Nublado',
        rain: '🌧️ Chuva',
        snow: '🌨️ Neve',
      },
      feelsLike: (t) => `(sensação ${t})`,
      wind: (kmh) => `💨 Vento ${kmh} km/h`,
      gusts: (kmh) => `(rajadas ${kmh})`,
      humidity: (pct) => `💧 Umidade ${pct} %`,
      costsIntro: '⏱️ O que as condições te custaram:',
      heat: '🔥 calor',
      cold: '🥶 frio',
      temperature: '🌡️ temperatura',
      slope: '⛰️ desnível',
      altitude: '🏔️ altitude',
      normalizedPace: (n, a) => `🎯 Pace normalizado: ${n} (real ${a})`,
      intensity: '🫀 Intensidade',
      easy: 'leve',
      moderate: 'moderada',
      hard: 'intensa',
      decoupling: (pct) => `🔋 Deriva cardíaca: ${pct} %`,
      decouplingSolid: 'resistência sólida 💪',
      decouplingFatigue: 'um pouco de cansaço no final',
      decouplingDeep: 'deriva forte, recupere bem 😮‍💨',
      halfMarathon: 'meia maratona',
      marathon: 'maratona',
      personalBest: (label, value) => `🏅 Recorde pessoal — ${label}: ${value}`,
      powerBest: (label, watts) =>
        `🏅 Recorde de potência — ${label}: ${watts} W`,
      load: (trimp) => `📈 Carga de treino: ${trimp} TRIMP`,
      liberty: (n) => `🗽 Subida: ${n}× a Estátua da Liberdade`,
      eiffel: (n) => `🗼 Subida: ${n}× a Torre Eiffel`,
      everestPercent: (pct) => `🏔️ Subida: ${pct} % do Everest`,
      everestTimes: (n) => `🏔️ Subida: ${n}× o Everest 🤯`,
      marathonPercent: (pct) => `🏃 ${pct} % de uma maratona`,
      marathonFull: '🎉 A distância de uma maratona inteira!',
      marathonTimes: (n) => `🏃 ${n}× a distância de uma maratona 🤯`,
      pool: (n) => `🏊 ${n} piscinas olímpicas`,
      pizza: (n) => `🍕 ≈ ${n} fatias de pizza queimadas`,
      footer: '⚡ Análise do OpenAthlete · openathlete.org',
    },
    [Language.DE]: {
      locale: 'de-DE',
      headlines: {
        pb: ['🏆 Rekordtag!', '🏆 Neue Bestzeit, nicht weniger!'],
        hot: ['🥵 Heiß da draußen', '☀️ Heute war es richtig heiß'],
        cold: [
          '🥶 Der Kälte getrotzt',
          '❄️ Heute brauchte es Mut, rauszugehen',
        ],
        rain: [
          '🌧️ Regen? Welcher Regen?',
          '☔ Nicht mal der Regen hat dich aufgehalten',
        ],
        snow: ['🌨️ Unterwegs im Schnee', '❄️ Schnee? Trotzdem los!'],
        long: [
          '🦾 Großer Tag draußen',
          '🏔️ Wieder eine lange Einheit in den Beinen',
        ],
        short: ['⚡ Kurz und knackig', '⚡ Schnell und effizient'],
        default: [
          '✅ Wieder eine auf dem Konto',
          '💪 Stark gemacht',
          '🔥 Wieder eine geschafft',
        ],
      },
      sky: {
        clear: '☀️ Klarer Himmel',
        'clear-night': '🌙 Klare Nacht',
        'partly-cloudy': '⛅ Teilweise bewölkt',
        cloudy: '☁️ Bewölkt',
        rain: '🌧️ Regen',
        snow: '🌨️ Schnee',
      },
      feelsLike: (t) => `(gefühlt ${t})`,
      wind: (kmh) => `💨 Wind ${kmh} km/h`,
      gusts: (kmh) => `(Böen ${kmh})`,
      humidity: (pct) => `💧 Luftfeuchtigkeit ${pct} %`,
      costsIntro: '⏱️ Was dich die Bedingungen gekostet haben:',
      heat: '🔥 Hitze',
      cold: '🥶 Kälte',
      temperature: '🌡️ Temperatur',
      slope: '⛰️ Höhenmeter',
      altitude: '🏔️ Höhe',
      normalizedPace: (n, a) =>
        `🎯 Normalisierte Pace: ${n} (tatsächlich ${a})`,
      intensity: '🫀 Intensität',
      easy: 'locker',
      moderate: 'moderat',
      hard: 'hart',
      decoupling: (pct) => `🔋 Kardiale Drift: ${pct} %`,
      decouplingSolid: 'grundsolide Ausdauer 💪',
      decouplingFatigue: 'gegen Ende etwas Ermüdung',
      decouplingDeep: 'starke Drift, erhol dich gut 😮‍💨',
      halfMarathon: 'Halbmarathon',
      marathon: 'Marathon',
      personalBest: (label, value) => `🏅 Bestzeit — ${label}: ${value}`,
      powerBest: (label, watts) => `🏅 Bestleistung — ${label}: ${watts} W`,
      load: (trimp) => `📈 Trainingsbelastung: ${trimp} TRIMP`,
      liberty: (n) => `🗽 Höhenmeter: ${n}× die Freiheitsstatue`,
      eiffel: (n) => `🗼 Höhenmeter: ${n}× der Eiffelturm`,
      everestPercent: (pct) => `🏔️ Höhenmeter: ${pct} % des Mount Everest`,
      everestTimes: (n) => `🏔️ Höhenmeter: ${n}× der Mount Everest 🤯`,
      marathonPercent: (pct) => `🏃 ${pct} % eines Marathons`,
      marathonFull: '🎉 Eine komplette Marathondistanz!',
      marathonTimes: (n) => `🏃 ${n}× die Marathondistanz 🤯`,
      pool: (n) => `🏊 ${n} Bahnen im olympischen Becken`,
      pizza: (n) => `🍕 ≈ ${n} Stück Pizza verbrannt`,
      footer: '⚡ Analyse von OpenAthlete · openathlete.org',
    },
  };

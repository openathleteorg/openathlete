/**
 * Every sentence of the trail plans, in the eight site languages. Session
 * texts take their numbers as arguments so the same wording serves every
 * week and every plan.
 */
export const LOCALES = [
  'en',
  'fr',
  'es',
  'it',
  'pt-br',
  'de',
  'pl',
  'nl',
] as const;
export type Locale = (typeof LOCALES)[number];
export type Text = Record<Locale, string>;

/** "45 min", "1h30", "2h". */
export function dur(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

/** Rep lengths as runners write them: 30", 2', 1'30. */
export function rep(sec: number): string {
  if (sec < 60) return `${sec}"`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}'${String(s).padStart(2, '0')}` : `${m}'`;
}

/** 1,000 in English; plain digits elsewhere, as people search "1000 D+". */
export function num(locale: Locale, value: number): string {
  return locale === 'en' ? value.toLocaleString('en') : String(value);
}

/** Polish noun forms after a number: 1 tydzień, 2 tygodnie, 5 tygodni. */
function plPlural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const tens = n % 100;
  return n % 10 >= 2 && n % 10 <= 4 && (tens < 12 || tens > 14) ? few : many;
}

/** The number a Polish noun agrees with in "4 lub 5": the last one. */
function lastNumber(label: string): number {
  return Number(label.split(' ').pop());
}

function each(fn: (l: Locale) => string): Text {
  return Object.fromEntries(LOCALES.map((l) => [l, fn(l)])) as Text;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export const T = {
  easy: {
    name: {
      en: 'Easy run',
      fr: 'Footing',
      es: 'Rodaje suave',
      it: 'Corsa lenta',
      de: 'Lockerer Dauerlauf',
      pl: 'Spokojny bieg',
      nl: 'Rustige duurloop',
      'pt-br': 'Rodagem leve',
    },
    desc: (min: number, strides: boolean): Text => {
      const d = dur(min);
      return {
        en:
          `${d} easy on flat or rolling ground, 62–70% of VMA. You should be able to talk in full sentences.` +
          (strides ? ' Finish with 6 × 20" strides, walking back.' : ''),
        fr:
          `${d} en aisance sur terrain plat ou vallonné, 62–70 % de VMA. Vous devez pouvoir parler en phrases complètes.` +
          (strides
            ? ' Terminez par 6 lignes droites de 20", retour en marchant.'
            : ''),
        es:
          `${d} suave por llano o terreno ondulado, al 62–70 % de la VAM. Tienes que poder hablar con frases enteras.` +
          (strides
            ? ' Termina con 6 progresiones de 20", vuelta andando.'
            : ''),
        it:
          `${d} tranquilli in piano o su saliscendi, al 62–70% della VAM. Devi riuscire a parlare con frasi intere.` +
          (strides ? ' Chiudi con 6 allunghi da 20", rientro camminando.' : ''),
        de:
          `${d} locker auf flachem oder welligem Gelände, 62–70 % der VMA. Du solltest dich in ganzen Sätzen unterhalten können.` +
          (strides
            ? ' Zum Schluss 6 × 20" Steigerungen, zurück im Gehen.'
            : ''),
        pl:
          `${d} spokojnie po płaskim lub pagórkowatym terenie, 62–70 % VMA. Musisz móc rozmawiać pełnymi zdaniami.` +
          (strides ? ' Na koniec 6 × 20" przebieżki, z powrotem marszem.' : ''),
        nl:
          `${d} rustig op vlak of glooiend terrein, 62–70% van je VMA. Je moet in hele zinnen kunnen praten.` +
          (strides
            ? ' Sluit af met 6 × 20" versnellingen, wandelend terug.'
            : ''),
        'pt-br':
          `${d} leve no plano ou em terreno ondulado, a 62–70% da VAM. Você deve conseguir falar frases inteiras.` +
          (strides
            ? ' Termine com 6 tiros curtos de 20", voltando caminhando.'
            : ''),
      };
    },
  },

  easyTrail: {
    name: {
      en: 'Easy trail run',
      fr: 'Footing nature',
      es: 'Rodaje suave por sendero',
      it: 'Corsa lenta su sentiero',
      de: 'Lockerer Traillauf',
      pl: 'Spokojny bieg w terenie',
      nl: 'Rustige trailloop',
      'pt-br': 'Rodagem leve na trilha',
    },
    desc: (min: number, dplus: number): Text =>
      each((l) => {
        const d = dur(min);
        const dp = num(l, dplus);
        return {
          en: `${d} easy on trails with about ${dp} m D+. Heart rate 65–75% of max; walk the steep bits without guilt.`,
          fr: `${d} tranquille sur sentier, environ ${dp} m D+. Cardio à 65–75 % de la FCmax ; marchez dans les passages raides sans scrupule.`,
          es: `${d} suave por sendero, unos ${dp} m D+. Pulso al 65–75 % de la FC máx.; camina en las rampas fuertes sin remordimientos.`,
          it: `${d} tranquilli su sentiero, circa ${dp} m D+. Cuore al 65–75% della FC max; nei tratti ripidi cammina senza sensi di colpa.`,
          de: `${d} locker auf Trails mit etwa ${dp} Hm. Herzfrequenz bei 65–75 % der HFmax; steile Passagen gehst du ohne schlechtes Gewissen.`,
          pl: `${d} spokojnie po szlakach, około ${dp} m przewyższenia. Tętno 65–75 % HRmax; strome odcinki podchodź bez wyrzutów sumienia.`,
          nl: `${d} rustig op trails met ongeveer ${dp} hoogtemeters. Blijf op 65–75% van je maximale hartslag; wandel de steile stukken zonder schuldgevoel.`,
          'pt-br': `${d} leve em trilha, cerca de ${dp} m D+. Frequência cardíaca a 65–75% da FC máx.; caminhe nos trechos íngremes sem culpa.`,
        }[l];
      }),
  },

  vma3030: {
    name: {
      en: '30/30 on the flat',
      fr: '30/30 sur le plat',
      es: '30/30 en llano',
      it: '30/30 in piano',
      de: '30/30 im Flachen',
      pl: '30/30 po płaskim',
      nl: '30/30 op vlak terrein',
      'pt-br': '30/30 no plano',
    },
    desc: (sets: number, reps: number): Text => ({
      en: `20 min easy, then ${sets} × (${reps} × 30" fast / 30" jog), 3 min easy between sets, 10 min cool-down. Fast = 95–100% of VMA, jog = 60%. Flat ground or a track.`,
      fr: `20 min d'échauffement, puis ${sets} × (${reps} × 30" vite / 30" trot), 3 min de récupération entre les séries, 10 min de retour au calme. Vite = 95–100 % de VMA, trot = 60 %. Sur le plat ou sur piste.`,
      es: `20 min de calentamiento, luego ${sets} × (${reps} × 30" rápido / 30" trote), 3 min suaves entre series y 10 min de vuelta a la calma. Rápido = 95–100 % de la VAM, trote = 60 %. En llano o en pista.`,
      it: `20 min di riscaldamento, poi ${sets} × (${reps} × 30" veloce / 30" corsa lenta), 3 min tra le serie, 10 min di defaticamento. Veloce = 95–100% della VAM, lento = 60%. In piano o in pista.`,
      de: `20 min Einlaufen, dann ${sets} × (${reps} × 30" schnell / 30" Trab), 3 min locker zwischen den Serien, 10 min Auslaufen. Schnell = 95–100 % der VMA, Trab = 60 %. Im Flachen oder auf der Bahn.`,
      pl: `20 min rozgrzewki, potem ${sets} × (${reps} × 30" szybko / 30" truchtu), 3 min spokojnie między seriami, 10 min schłodzenia. Szybko = 95–100 % VMA, trucht = 60 %. Po płaskim albo na stadionie.`,
      nl: `20 min warming-up, dan ${sets} × (${reps} × 30" snel / 30" dribbelen), 3 min rustig tussen de series, 10 min cooling-down. Snel = 95–100% van je VMA, dribbelen = 60%. Op vlak terrein of op de baan.`,
      'pt-br': `20 min de aquecimento, depois ${sets} × (${reps} × 30" rápido / 30" trote), 3 min leves entre as séries e 10 min de desaquecimento. Rápido = 95–100% da VAM, trote = 60%. No plano ou na pista.`,
    }),
  },

  intervals: {
    name: {
      en: 'VMA intervals',
      fr: 'Fractionné VMA',
      es: 'Series de VAM',
      it: 'Ripetute alla VAM',
      de: 'VMA-Intervalle',
      pl: 'Interwały VMA',
      nl: 'VMA-intervallen',
      'pt-br': 'Tiros de VAM',
    },
    desc: (reps: number, sec: number, rec: number): Text => {
      const r = rep(sec);
      const c = rep(rec);
      return {
        en: `20 min easy, ${reps} × ${r} at 90–95% of VMA with ${c} jog recovery, 10 min cool-down. On the flat: the higher the ceiling, the easier every climb feels.`,
        fr: `20 min d'échauffement, ${reps} × ${r} à 90–95 % de VMA, récupération ${c} en trottinant, 10 min de retour au calme. Sur le plat : plus le plafond est haut, plus les montées paraissent faciles.`,
        es: `20 min de calentamiento, ${reps} × ${r} al 90–95 % de la VAM con ${c} de trote, 10 min de vuelta a la calma. En llano: cuanto más alto el techo, más fáciles las subidas.`,
        it: `20 min di riscaldamento, ${reps} × ${r} al 90–95% della VAM con recupero di ${c} di corsa lenta, 10 min di defaticamento. In piano: più alto è il tetto, più facili sembrano le salite.`,
        de: `20 min Einlaufen, ${reps} × ${r} bei 90–95 % der VMA mit ${c} Trabpause, 10 min Auslaufen. Im Flachen: Je höher deine Decke, desto leichter fühlt sich jeder Anstieg an.`,
        pl: `20 min rozgrzewki, ${reps} × ${r} w tempie 90–95 % VMA z ${c} truchtu na przerwę, 10 min schłodzenia. Po płaskim: im wyżej masz sufit, tym łatwiej idzie każdy podbieg.`,
        nl: `20 min warming-up, ${reps} × ${r} op 90–95% van je VMA met ${c} dribbelpauze, 10 min cooling-down. Op vlak terrein: hoe hoger je plafond, hoe makkelijker elke klim aanvoelt.`,
        'pt-br': `20 min de aquecimento, ${reps} × ${r} a 90–95% da VAM com ${c} de trote, 10 min de desaquecimento. No plano: quanto mais alto o teto, mais fáceis ficam as subidas.`,
      };
    },
  },

  tempo: {
    name: {
      en: 'Tempo on the flat',
      fr: 'Seuil sur le plat',
      es: 'Umbral en llano',
      it: 'Soglia in piano',
      de: 'Tempodauerlauf im Flachen',
      pl: 'Bieg progowy po płaskim',
      nl: 'Tempoloop op vlak terrein',
      'pt-br': 'Limiar no plano',
    },
    desc: (reps: number, min: number): Text => {
      const m = rep(min * 60);
      return {
        en: `15 min easy, ${reps} × ${m} at 82–87% of VMA (comfortably hard, a few words at a time) with 2 min easy between, 10 min cool-down.`,
        fr: `15 min d'échauffement, ${reps} × ${m} à 82–87 % de VMA (soutenu mais contrôlé, quelques mots à la fois), récupération 2 min, 10 min de retour au calme.`,
        es: `15 min de calentamiento, ${reps} × ${m} al 82–87 % de la VAM (exigente pero controlado, solo frases cortas), 2 min suaves entre bloques, 10 min de vuelta a la calma.`,
        it: `15 min di riscaldamento, ${reps} × ${m} all'82–87% della VAM (impegnativo ma controllato, riesci a dire poche parole), 2 min di recupero, 10 min di defaticamento.`,
        de: `15 min Einlaufen, ${reps} × ${m} bei 82–87 % der VMA (fordernd, aber kontrolliert, nur ein paar Worte am Stück) mit 2 min locker dazwischen, 10 min Auslaufen.`,
        pl: `15 min rozgrzewki, ${reps} × ${m} w tempie 82–87 % VMA (mocno, ale pod kontrolą, mówisz już tylko pojedyncze słowa) z 2 min spokojnie pomiędzy, 10 min schłodzenia.`,
        nl: `15 min warming-up, ${reps} × ${m} op 82–87% van je VMA (stevig maar beheerst, je kunt nog maar een paar woorden tegelijk zeggen) met 2 min rustig ertussen, 10 min cooling-down.`,
        'pt-br': `15 min de aquecimento, ${reps} × ${m} a 82–87% da VAM (forte mas controlado, só frases curtas), 2 min leves entre os blocos, 10 min de desaquecimento.`,
      };
    },
  },

  hills: {
    name: {
      en: 'Hill repeats',
      fr: 'Séance de côtes',
      es: 'Cuestas',
      it: 'Ripetute in salita',
      de: 'Bergintervalle',
      pl: 'Podbiegi',
      nl: 'Heuveltraining',
      'pt-br': 'Treino de subidas',
    },
    desc: (reps: number, sec: number, lo: number, hi: number): Text => {
      const r = rep(sec);
      return {
        en: `20 min easy to the bottom of an 8–12% climb, then ${reps} × ${r} uphill at ${lo}–${hi}% of max heart rate, jogging or walking back down as recovery. 10 min cool-down. Heart rate lags on short efforts: aim for the top of the range by the end of each rep, and keep the last rep as good as the first.`,
        fr: `20 min d'échauffement jusqu'au pied d'une côte à 8–12 %, puis ${reps} × ${r} en montée à ${lo}–${hi} % de la FCmax, récupération en redescendant au trot ou en marchant. 10 min de retour au calme. Le cardio monte avec retard sur les efforts courts : visez le haut de la plage en fin de répétition, et gardez la dernière aussi propre que la première.`,
        es: `20 min de calentamiento hasta el pie de una cuesta del 8–12 %, luego ${reps} × ${r} cuesta arriba al ${lo}–${hi} % de la FC máx., recuperando al bajar trotando o andando. 10 min de vuelta a la calma. El pulso va con retraso en los esfuerzos cortos: busca la parte alta del rango al final de cada repetición, y que la última salga tan bien como la primera.`,
        it: `20 min di riscaldamento fino ai piedi di una salita all'8–12%, poi ${reps} × ${r} in salita al ${lo}–${hi}% della FC max, recupero scendendo di corsa lenta o camminando. 10 min di defaticamento. Sugli sforzi brevi il cuore sale in ritardo: punta alla parte alta della forchetta a fine ripetuta, e tieni l'ultima pulita come la prima.`,
        de: `20 min Einlaufen bis zum Fuß eines Anstiegs mit 8–12 %, dann ${reps} × ${r} bergauf bei ${lo}–${hi} % der HFmax, zur Erholung trabend oder gehend wieder hinunter. 10 min Auslaufen. Bei kurzen Belastungen steigt die Herzfrequenz verzögert: Peil zum Ende jeder Wiederholung den oberen Bereich an und lauf die letzte so sauber wie die erste.`,
        pl: `20 min rozgrzewki do podnóża podbiegu o nachyleniu 8–12 %, potem ${reps} × ${r} pod górę na ${lo}–${hi} % HRmax, na przerwę zbieg truchtem albo marszem. 10 min schłodzenia. Przy krótkich wysiłkach tętno rośnie z opóźnieniem: pod koniec każdego powtórzenia celuj w górną granicę zakresu, a ostatnie zrób tak samo dobrze jak pierwsze.`,
        nl: `20 min warming-up naar de voet van een helling van 8–12%, dan ${reps} × ${r} bergop op ${lo}–${hi}% van je maximale hartslag, als herstel dribbelend of wandelend terug naar beneden. 10 min cooling-down. Bij korte inspanningen loopt je hartslag achter: mik aan het eind van elke herhaling op de bovenkant van de zone, en loop de laatste net zo netjes als de eerste.`,
        'pt-br': `20 min de aquecimento até o pé de uma subida de 8–12%, depois ${reps} × ${r} subindo a ${lo}–${hi}% da FC máx., recuperando na descida em trote ou caminhando. 10 min de desaquecimento. A frequência cardíaca demora a subir em esforços curtos: busque o topo da faixa no fim de cada tiro, e faça o último tão bem quanto o primeiro.`,
      };
    },
  },

  uphillTempo: {
    name: {
      en: 'Long uphill tempo',
      fr: 'Montée au seuil',
      es: 'Subida larga a umbral',
      it: 'Salita lunga a soglia',
      de: 'Schwellenlauf bergauf',
      pl: 'Długi podbieg progowy',
      nl: 'Lange drempelklim',
      'pt-br': 'Subida longa no limiar',
    },
    desc: (reps: number, min: number): Text => {
      const m = rep(min * 60);
      return {
        en: `20 min easy, then ${reps} × ${m} climbing steadily at 82–87% of max heart rate on a long, runnable climb (5–10%). Walk or jog down as recovery. 10 min cool-down. Hike if the grade forces you to, but keep the heart rate in range.`,
        fr: `20 min d'échauffement, puis ${reps} × ${m} de montée régulière à 82–87 % de la FCmax sur une longue pente courable (5–10 %). Récupération en redescendant au trot ou en marchant. 10 min de retour au calme. Si la pente vous oblige à marcher, marchez, mais gardez le cardio dans la plage.`,
        es: `20 min de calentamiento, luego ${reps} × ${m} subiendo de forma constante al 82–87 % de la FC máx. en una subida larga y corrible (5–10 %). Recupera bajando al trote o andando. 10 min de vuelta a la calma. Si la pendiente te obliga a caminar, camina, pero mantén el pulso en el rango.`,
        it: `20 min di riscaldamento, poi ${reps} × ${m} di salita regolare all'82–87% della FC max su una salita lunga e corribile (5–10%). Recupero scendendo di corsa lenta o camminando. 10 min di defaticamento. Se la pendenza ti costringe a camminare, cammina, ma tieni il cuore nella forchetta.`,
        de: `20 min Einlaufen, dann ${reps} × ${m} gleichmäßig bergauf bei 82–87 % der HFmax an einem langen, laufbaren Anstieg (5–10 %). Zur Erholung gehend oder trabend hinunter. 10 min Auslaufen. Wenn die Steigung dich zum Gehen zwingt, geh, aber halte die Herzfrequenz im Bereich.`,
        pl: `20 min rozgrzewki, potem ${reps} × ${m} równo pod górę na 82–87 % HRmax, na długim, podbiegalnym wzniesieniu (5–10 %). Na przerwę zbieg truchtem albo marszem. 10 min schłodzenia. Jeśli nachylenie zmusza Cię do marszu, maszeruj, ale trzymaj tętno w zakresie.`,
        nl: `20 min warming-up, dan ${reps} × ${m} gelijkmatig bergop op 82–87% van je maximale hartslag, op een lange, beloopbare klim (5–10%). Wandel of dribbel terug naar beneden als herstel. 10 min cooling-down. Dwingt de helling je om te wandelen, wandel dan, maar houd je hartslag in de zone.`,
        'pt-br': `20 min de aquecimento, depois ${reps} × ${m} subindo em ritmo constante a 82–87% da FC máx. numa subida longa e corrível (5–10%). Recupere descendo em trote ou caminhando. 10 min de desaquecimento. Se a inclinação obrigar a caminhar, caminhe, mas mantenha a FC na faixa.`,
      };
    },
  },

  hike: {
    name: {
      en: 'Power hiking with poles',
      fr: 'Rando-course avec bâtons',
      es: 'Caminar rápido con bastones',
      it: 'Camminata veloce con i bastoncini',
      de: 'Power Hiking mit Stöcken',
      pl: 'Szybki marsz z kijami',
      nl: 'Powerhiken met stokken',
      'pt-br': 'Caminhada rápida com bastões',
    },
    desc: (reps: number, min: number): Text => {
      const m = rep(min * 60);
      return {
        en: `15 min easy, then ${reps} × ${m} power hiking up the steepest climb you have (15% and more), with poles, at 75–85% of max heart rate. Short steps, push down hard on the poles, and run the flatter bits. Easy descent between reps. This is how most people climb on race day: it deserves practice.`,
        fr: `15 min d'échauffement, puis ${reps} × ${m} de marche rapide dans la pente la plus raide que vous ayez (15 % et plus), avec bâtons, à 75–85 % de la FCmax. Petits pas, poussée franche sur les bâtons, et relancez en courant dès que ça s'adoucit. Descente tranquille entre les répétitions. C'est ainsi que la plupart des coureurs montent le jour J : ça se travaille.`,
        es: `15 min de calentamiento, luego ${reps} × ${m} caminando rápido por la pendiente más dura que tengas (15 % o más), con bastones, al 75–85 % de la FC máx. Pasos cortos, empuja fuerte con los bastones y corre en los tramos más suaves. Baja tranquilo entre repeticiones. Así sube la mayoría el día de la carrera: merece entrenarse.`,
        it: `15 min di riscaldamento, poi ${reps} × ${m} di camminata veloce sulla salita più ripida che hai (dal 15% in su), con i bastoncini, al 75–85% della FC max. Passi corti, spinta decisa sui bastoncini, e riprendi a correre dove spiana. Discesa tranquilla tra le ripetute. In gara la maggior parte dei trailer sale così: va allenato.`,
        de: `15 min Einlaufen, dann ${reps} × ${m} Power Hiking am steilsten Anstieg, den du findest (15 % und mehr), mit Stöcken, bei 75–85 % der HFmax. Kurze Schritte, kräftig auf die Stöcke drücken, und die flacheren Stücke läufst du. Locker bergab zwischen den Wiederholungen. So steigen die meisten am Wettkampftag: Das lohnt sich zu üben.`,
        pl: `15 min rozgrzewki, potem ${reps} × ${m} szybkiego marszu pod najbardziej stromą górkę, jaką masz w okolicy (15 % i więcej), z kijami, na 75–85 % HRmax. Krótkie kroki, mocne odepchnięcie kijami, a łagodniejsze odcinki podbiegaj. Spokojne zejście między powtórzeniami. Tak podchodzi większość zawodników w dniu startu: warto to ćwiczyć.`,
        nl: `15 min warming-up, dan ${reps} × ${m} powerhiken op de steilste helling die je kunt vinden (15% en meer), met stokken, op 75–85% van je maximale hartslag. Korte passen, stevig afzetten op je stokken, en de vlakkere stukken loop je hard. Rustig naar beneden tussen de herhalingen. Zo klimmen de meeste lopers op wedstrijddag: het is het oefenen waard.`,
        'pt-br': `15 min de aquecimento, depois ${reps} × ${m} de caminhada rápida na subida mais íngreme que você tiver (15% ou mais), com bastões, a 75–85% da FC máx. Passos curtos, empurre firme os bastões e volte a correr nos trechos mais suaves. Descida tranquila entre as repetições. É assim que a maioria sobe no dia da prova: vale treinar.`,
      };
    },
  },

  downhill: {
    name: {
      en: 'Downhill technique',
      fr: 'Descente technique',
      es: 'Técnica de bajada',
      it: 'Tecnica di discesa',
      de: 'Bergab-Technik',
      pl: 'Technika zbiegania',
      nl: 'Afdaaltechniek',
      'pt-br': 'Técnica de descida',
    },
    desc: (reps: number, sec: number): Text => {
      const r = rep(sec);
      return {
        en: `20 min easy to a technical descent (roots, rocks, 10–20%). ${reps} × ${r} downhill at a controlled effort (RPE 5/10), hiking back up as recovery. Quick, short steps, eyes 3–4 metres ahead, arms wide for balance, feet landing under your hips. Speed comes later: today is about feet you trust. 10 min easy to finish.`,
        fr: `20 min de footing jusqu'à une descente technique (racines, cailloux, 10–20 %). ${reps} × ${r} de descente à effort contrôlé (RPE 5/10), remontée en marchant pour récupérer. Pas courts et rapides, regard 3–4 mètres devant, bras écartés pour l'équilibre, appuis sous le bassin. La vitesse viendra ensuite : aujourd'hui, on cherche des appuis en confiance. 10 min de footing pour finir.`,
        es: `20 min suaves hasta una bajada técnica (raíces, piedras, 10–20 %). ${reps} × ${r} cuesta abajo a esfuerzo controlado (RPE 5/10), subiendo andando para recuperar. Pasos cortos y rápidos, la vista 3–4 metros por delante, brazos abiertos para equilibrarte, apoyos bajo la cadera. La velocidad llegará después: hoy se trata de pisar con confianza. 10 min suaves para terminar.`,
        it: `20 min di corsa lenta fino a una discesa tecnica (radici, sassi, 10–20%). ${reps} × ${r} in discesa a sforzo controllato (RPE 5/10), risalendo a piedi per recuperare. Passi corti e rapidi, sguardo 3–4 metri avanti, braccia larghe per l'equilibrio, appoggi sotto il bacino. La velocità arriverà dopo: oggi cerchi appoggi di cui fidarti. 10 min di corsa lenta per chiudere.`,
        de: `20 min locker bis zu einem technischen Bergab-Stück (Wurzeln, Steine, 10–20 %). ${reps} × ${r} bergab mit kontrollierter Anstrengung (RPE 5/10), zur Erholung gehend wieder hinauf. Kurze, schnelle Schritte, Blick 3–4 Meter voraus, Arme für die Balance weit geöffnet, Füße landen unter der Hüfte. Das Tempo kommt später: Heute geht es um Tritte, denen du vertraust. 10 min locker zum Abschluss.`,
        pl: `20 min spokojnie do technicznego zbiegu (korzenie, kamienie, 10–20 %). ${reps} × ${r} w dół z kontrolowanym wysiłkiem (RPE 5/10), na przerwę podejście marszem. Szybkie, krótkie kroki, wzrok 3–4 metry przed sobą, ręce szeroko dla równowagi, stopy lądują pod biodrami. Szybkość przyjdzie później: dziś chodzi o kroki, którym ufasz. 10 min spokojnie na koniec.`,
        nl: `20 min rustig naar een technische afdaling (wortels, stenen, 10–20%). ${reps} × ${r} bergaf met een gecontroleerde inspanning (RPE 5/10), wandelend weer omhoog als herstel. Snelle, korte passen, blik 3–4 meter vooruit, armen breed voor je balans, voeten landen onder je heupen. Snelheid komt later: vandaag gaat het om voeten waarop je kunt vertrouwen. 10 min rustig om af te sluiten.`,
        'pt-br': `20 min leves até uma descida técnica (raízes, pedras, 10–20%). ${reps} × ${r} descendo em esforço controlado (PSE 5/10), subindo caminhando para recuperar. Passos curtos e rápidos, olhar 3–4 metros à frente, braços abertos para o equilíbrio, pisadas embaixo do quadril. A velocidade vem depois: hoje o objetivo é confiar nas pisadas. 10 min leves para terminar.`,
      };
    },
  },

  long: {
    name: {
      en: 'Long run with D+',
      fr: 'Sortie longue en D+',
      es: 'Tirada larga con desnivel',
      it: 'Lungo con dislivello',
      de: 'Langer Lauf mit Hm',
      pl: 'Długie wybieganie z przewyższeniem',
      nl: 'Lange duurloop met hoogtemeters',
      'pt-br': 'Longão com altimetria',
    },
    nameB2b: {
      en: 'Back-to-back long run (day 2)',
      fr: 'Sortie longue enchaînée (jour 2)',
      es: 'Tirada larga encadenada (día 2)',
      it: 'Lungo in back-to-back (giorno 2)',
      de: 'Zweiter langer Lauf (Tag 2)',
      pl: 'Długie wybieganie dzień po dniu (dzień 2)',
      nl: 'Back-to-back lange duurloop (dag 2)',
      'pt-br': 'Longão encadeado (dia 2)',
    },
    nameRehearsal: {
      en: 'Race rehearsal',
      fr: 'Répétition générale',
      es: 'Ensayo general',
      it: 'Prova generale',
      de: 'Generalprobe',
      pl: 'Próba generalna',
      nl: 'Generale repetitie',
      'pt-br': 'Ensaio geral',
    },
    desc: (
      min: number,
      dplus: number,
      opts: {
        poles?: boolean;
        block?: number;
        b2b?: boolean;
        rehearsal?: boolean;
      },
    ): Text =>
      each((l) => {
        const d = dur(min);
        const dp = num(l, dplus);
        const b = opts.block ? dur(opts.block) : '';
        const parts = {
          en: [
            opts.b2b &&
              'Second long run in a row, on tired legs: that is the point.',
            `${d} on trails with about ${dp} m D+, at 65–75% of max heart rate. Run the flats and gentle climbs, power-hike anything steeper than 15%, and practise eating every 30–40 minutes.`,
            opts.poles && 'Bring your poles and use them on every long climb.',
            opts.block &&
              `Run the last ${b} at race effort (75–82% of max heart rate).`,
            opts.rehearsal &&
              'Wear what you will race in, carry the same pack and eat the same food: nothing new on race day.',
          ],
          fr: [
            opts.b2b &&
              "Deuxième sortie longue d'affilée, sur des jambes fatiguées : c'est voulu.",
            `${d} sur sentier avec environ ${dp} m D+, à 65–75 % de la FCmax. Courez le plat et les pentes douces, marchez vite dès que ça dépasse 15 %, et entraînez-vous à manger toutes les 30–40 minutes.`,
            opts.poles &&
              'Prenez vos bâtons et servez-vous-en dans chaque longue montée.',
            opts.block &&
              `Courez les dernières ${b} à l'effort de course (75–82 % de la FCmax).`,
            opts.rehearsal &&
              'Portez la tenue de course, le même sac et la même nutrition : rien de nouveau le jour J.',
          ],
          es: [
            opts.b2b &&
              'Segunda tirada larga seguida, con las piernas cansadas: de eso se trata.',
            `${d} por sendero con unos ${dp} m D+, al 65–75 % de la FC máx. Corre el llano y las pendientes suaves, camina rápido en todo lo que pase del 15 % y practica comer cada 30–40 minutos.`,
            opts.poles && 'Lleva los bastones y úsalos en cada subida larga.',
            opts.block &&
              `Haz los últimos ${b} a ritmo de carrera (75–82 % de la FC máx.).`,
            opts.rehearsal &&
              'Usa la ropa de carrera, la misma mochila y la misma comida: nada nuevo el día de la carrera.',
          ],
          it: [
            opts.b2b &&
              'Secondo lungo di fila, con le gambe stanche: è proprio questo lo scopo.',
            `${d} su sentiero con circa ${dp} m D+, al 65–75% della FC max. Corri il piano e le salite dolci, cammina veloce dove si supera il 15%, e allenati a mangiare ogni 30–40 minuti.`,
            opts.poles && 'Porta i bastoncini e usali in ogni salita lunga.',
            opts.block && `Gli ultimi ${b} a ritmo gara (75–82% della FC max).`,
            opts.rehearsal &&
              'Indossa ciò che userai in gara, stesso zaino e stesso cibo: niente di nuovo il giorno della gara.',
          ],
          de: [
            opts.b2b &&
              'Zweiter langer Lauf in Folge, auf müden Beinen: Genau darum geht es.',
            `${d} auf Trails mit etwa ${dp} Hm, bei 65–75 % der HFmax. Lauf im Flachen und an sanften Anstiegen, geh alles Steilere als 15 % zügig hoch und übe, alle 30–40 Minuten zu essen.`,
            opts.poles &&
              'Nimm deine Stöcke mit und setz sie an jedem langen Anstieg ein.',
            opts.block &&
              `Lauf die letzten ${b} in Wettkampfintensität (75–82 % der HFmax).`,
            opts.rehearsal &&
              'Trag, was du im Wettkampf trägst, mit demselben Rucksack und derselben Verpflegung: nichts Neues am Wettkampftag.',
          ],
          pl: [
            opts.b2b &&
              'Drugie długie wybieganie z rzędu, na zmęczonych nogach: właśnie o to chodzi.',
            `${d} po szlakach z około ${dp} m przewyższenia, na 65–75 % HRmax. Płaskie odcinki i łagodne podbiegi biegnij, wszystko powyżej 15 % pokonuj szybkim marszem i ćwicz jedzenie co 30–40 minut.`,
            opts.poles && 'Weź kije i używaj ich na każdym długim podejściu.',
            opts.block &&
              `Ostatnie ${b} biegnij z intensywnością startową (75–82 % HRmax).`,
            opts.rehearsal &&
              'Ubierz się jak na start, weź ten sam plecak i to samo jedzenie: w dniu startu nic nowego.',
          ],
          nl: [
            opts.b2b &&
              'Tweede lange duurloop op rij, op vermoeide benen: daar gaat het juist om.',
            `${d} op trails met ongeveer ${dp} hoogtemeters, op 65–75% van je maximale hartslag. Loop het vlakke en de flauwe klimmen, powerhike alles wat steiler is dan 15% en oefen met eten om de 30–40 minuten.`,
            opts.poles &&
              'Neem je stokken mee en gebruik ze op elke lange klim.',
            opts.block &&
              `Loop de laatste ${b} op wedstrijdintensiteit (75–82% van je maximale hartslag).`,
            opts.rehearsal &&
              'Draag wat je in de wedstrijd draagt, met dezelfde rugzak en dezelfde voeding: niets nieuws op wedstrijddag.',
          ],
          'pt-br': [
            opts.b2b &&
              'Segundo longão seguido, com as pernas cansadas: essa é a ideia.',
            `${d} em trilha com cerca de ${dp} m D+, a 65–75% da FC máx. Corra o plano e as subidas suaves, caminhe rápido em tudo que passar de 15% e treine comer a cada 30–40 minutos.`,
            opts.poles && 'Leve os bastões e use-os em cada subida longa.',
            opts.block &&
              `Faça os últimos ${b} no esforço de prova (75–82% da FC máx.).`,
            opts.rehearsal &&
              'Use a roupa da prova, a mesma mochila e a mesma comida: nada de novo no dia da prova.',
          ],
        }[l];
        return parts.filter(Boolean).join(' ');
      }),
  },

  shakeout: {
    name: {
      en: 'Shake-out run',
      fr: 'Déblocage',
      es: 'Rodaje de activación',
      it: 'Sgambata pre-gara',
      de: 'Lockerungslauf',
      pl: 'Rozruch',
      nl: 'Losloopje',
      'pt-br': 'Trote de soltura',
    },
    desc: {
      en: '20 min very easy with 4 short strides. Check your gear, pin your bib, go to bed early.',
      fr: '20 min très facile avec 4 accélérations courtes. Vérifiez le matériel, accrochez le dossard, couchez-vous tôt.',
      es: '20 min muy suaves con 4 progresiones cortas. Revisa el material, prepara el dorsal y acuéstate pronto.',
      it: '20 min molto facili con 4 brevi allunghi. Controlla il materiale, prepara il pettorale, a letto presto.',
      de: '20 min sehr locker mit 4 kurzen Steigerungen. Ausrüstung checken, Startnummer anstecken, früh ins Bett.',
      pl: '20 min bardzo spokojnie z 4 krótkimi przebieżkami. Sprawdź sprzęt, przypnij numer startowy, idź wcześnie spać.',
      nl: '20 min heel rustig met 4 korte versnellingen. Check je uitrusting, speld je startnummer op, ga vroeg naar bed.',
      'pt-br':
        '20 min bem leves com 4 tiros curtos. Confira o equipamento, prenda o número de peito e durma cedo.',
    } as Text,
  },

  race: {
    name: (km: number): Text => ({
      en: `Race day: ${km} km trail`,
      fr: `Jour J : trail de ${km} km`,
      es: `Día de carrera: trail de ${km} km`,
      it: `Giorno di gara: trail di ${km} km`,
      de: `Wettkampftag: Trail über ${km} km`,
      pl: `Dzień startu: trail ${km} km`,
      nl: `Wedstrijddag: trail van ${km} km`,
      'pt-br': `Dia de prova: trail de ${km} km`,
    }),
    desc: (km: number, dplus: number): Text =>
      each((l) => {
        const dp = num(l, dplus);
        return {
          en: `${km} km, about ${dp} m D+. Start slower than feels right: climbs at 75–82% of max heart rate, eat and drink from the first hour, and save your legs for the last descents.`,
          fr: `${km} km, environ ${dp} m D+. Partez plus lentement que vous n'en avez envie : montées à 75–82 % de la FCmax, mangez et buvez dès la première heure, et gardez des jambes pour les dernières descentes.`,
          es: `${km} km, unos ${dp} m D+. Sal más despacio de lo que te pide el cuerpo: subidas al 75–82 % de la FC máx., come y bebe desde la primera hora y guarda piernas para las últimas bajadas.`,
          it: `${km} km, circa ${dp} m D+. Parti più piano di quanto ti venga voglia: salite al 75–82% della FC max, mangia e bevi dalla prima ora e conserva le gambe per le ultime discese.`,
          de: `${km} km, etwa ${dp} Hm. Geh langsamer an, als es sich richtig anfühlt: Anstiege bei 75–82 % der HFmax, iss und trink ab der ersten Stunde und spar dir Kraft in den Beinen für die letzten Abstiege.`,
          pl: `${km} km, około ${dp} m przewyższenia. Zacznij wolniej, niż podpowiada Ci ciało: podbiegi na 75–82 % HRmax, jedz i pij od pierwszej godziny i zachowaj siły w nogach na ostatnie zbiegi.`,
          nl: `${km} km, ongeveer ${dp} hoogtemeters. Start langzamer dan goed voelt: klimmen op 75–82% van je maximale hartslag, eet en drink vanaf het eerste uur en spaar je benen voor de laatste afdalingen.`,
          'pt-br': `${km} km, cerca de ${dp} m D+. Largue mais devagar do que dá vontade: subidas a 75–82% da FC máx., coma e beba desde a primeira hora e guarde pernas para as últimas descidas.`,
        }[l];
      }),
  },

  strength: {
    name: {
      en: 'Strength for trail (optional)',
      fr: 'Renforcement trail (facultatif)',
      es: 'Fuerza para trail (opcional)',
      it: 'Forza per il trail (facoltativo)',
      de: 'Krafttraining für Trail (optional)',
      pl: 'Trening siłowy pod trail (opcjonalnie)',
      nl: 'Krachttraining voor trail (optioneel)',
      'pt-br': 'Fortalecimento para trail (opcional)',
    },
    nameMobility: {
      en: 'Mobility and ankles (optional)',
      fr: 'Mobilité et chevilles (facultatif)',
      es: 'Movilidad y tobillos (opcional)',
      it: 'Mobilità e caviglie (facoltativo)',
      de: 'Mobilität und Sprunggelenke (optional)',
      pl: 'Mobilność i stawy skokowe (opcjonalnie)',
      nl: 'Mobiliteit en enkels (optioneel)',
      'pt-br': 'Mobilidade e tornozelos (opcional)',
    },
    desc: (variant: 'a' | 'b' | 'mobility', min: number): Text => {
      const d = dur(min);
      if (variant === 'a')
        return {
          en: `${d}, at home, no equipment. 3 rounds of: 12 step-ups per leg onto a chair or a sturdy step, 10 split squats per leg, 15 slow calf raises on a step (3 seconds down), 30 s single-leg balance per leg with eyes closed, 30 s side plank per side. Quads take the hit on descents and ankles on rough ground: this is cheap insurance.`,
          fr: `${d}, à la maison, sans matériel. 3 tours de : 12 montées de marche par jambe (chaise ou marche solide), 10 fentes par jambe, 15 montées sur pointes au bord d'une marche (3 secondes pour redescendre), 30 s d'équilibre sur une jambe les yeux fermés, 30 s de gainage latéral de chaque côté. Les quadriceps encaissent les descentes et les chevilles les terrains cassants : c'est une assurance qui ne coûte pas cher.`,
          es: `${d}, en casa y sin material. 3 vueltas de: 12 subidas a un escalón o una silla por pierna, 10 zancadas por pierna, 15 elevaciones de talones lentas en un escalón (3 segundos para bajar), 30 s de equilibrio a una pierna con los ojos cerrados, 30 s de plancha lateral por lado. Los cuádriceps sufren en las bajadas y los tobillos en el terreno roto: es un seguro barato.`,
          it: `${d}, a casa, senza attrezzi. 3 giri di: 12 step-up per gamba su una sedia o un gradino, 10 affondi per gamba, 15 sollevamenti sui polpacci lenti su un gradino (3 secondi per scendere), 30 s in equilibrio su una gamba a occhi chiusi, 30 s di plank laterale per lato. I quadricipiti incassano le discese e le caviglie il terreno sconnesso: è un'assicurazione che costa poco.`,
          de: `${d}, zu Hause, ohne Geräte. 3 Runden: 12 Step-ups pro Bein auf einen Stuhl oder eine stabile Stufe, 10 Split Squats pro Bein, 15 langsame Wadenheben auf einer Stufe (3 Sekunden absenken), 30 s Einbeinstand pro Bein mit geschlossenen Augen, 30 s Seitstütz pro Seite. Bergab leiden die Oberschenkel, auf unebenem Boden die Sprunggelenke: Das ist eine günstige Versicherung.`,
          pl: `${d}, w domu, bez sprzętu. 3 rundy: 12 wejść na krzesło lub stabilny stopień na nogę, 10 przysiadów wykrocznych na nogę, 15 powolnych wspięć na palce na stopniu (3 sekundy opuszczania), 30 s stania na jednej nodze z zamkniętymi oczami na nogę, 30 s deski bokiem na stronę. Na zbiegach obrywają mięśnie czworogłowe, a na nierównym terenie stawy skokowe: to tania polisa ubezpieczeniowa.`,
          nl: `${d}, thuis, zonder materiaal. 3 rondes: 12 step-ups per been op een stoel of een stevige trede, 10 split squats per been, 15 langzame kuitheffingen op een trede (3 seconden zakken), 30 s op één been balanceren met je ogen dicht per been, 30 s zijplank per kant. Bij afdalingen vangen je bovenbenen de klappen op, op ruw terrein je enkels: dit is een goedkope verzekering.`,
          'pt-br': `${d}, em casa, sem equipamento. 3 voltas de: 12 subidas no degrau ou numa cadeira por perna, 10 afundos por perna, 15 elevações de panturrilha lentas num degrau (3 segundos para descer), 30 s de equilíbrio numa perna de olhos fechados, 30 s de prancha lateral de cada lado. O quadríceps sofre nas descidas e os tornozelos no terreno irregular: é um seguro barato.`,
        };
      if (variant === 'b')
        return {
          en: `${d}. 3 rounds of: 8 slow single-leg squats off a step per leg (5 seconds down: this is what descents do to your quads), 12 jumping step-ups per leg, 20 single-leg calf raises per leg, 10 single-leg deadlifts per leg, 45 s plank. Only 2 rounds in a lighter week.`,
          fr: `${d}. 3 tours de : 8 squats lents sur une jambe depuis une marche, par jambe (5 secondes pour descendre : c'est exactement ce que les descentes font subir à vos quadriceps), 12 montées de marche sautées par jambe, 20 montées sur pointe d'un seul pied par jambe, 10 soulevés de terre sur une jambe par côté, 45 s de gainage. 2 tours seulement en semaine allégée.`,
          es: `${d}. 3 vueltas de: 8 sentadillas lentas a una pierna desde un escalón, por pierna (5 segundos para bajar: es lo que las bajadas hacen a tus cuádriceps), 12 subidas al escalón con salto por pierna, 20 elevaciones de talón a una pierna por lado, 10 pesos muertos a una pierna por lado, 45 s de plancha. Solo 2 vueltas en semana de descarga.`,
          it: `${d}. 3 giri di: 8 squat lenti su una gamba da un gradino, per gamba (5 secondi per scendere: è ciò che le discese fanno ai quadricipiti), 12 step-up saltati per gamba, 20 sollevamenti sul polpaccio su una gamba per lato, 10 stacchi su una gamba per lato, 45 s di plank. Solo 2 giri nella settimana di scarico.`,
          de: `${d}. 3 Runden: 8 langsame einbeinige Kniebeugen von einer Stufe pro Bein (5 Sekunden absenken: genau das machen Abstiege mit deinen Oberschenkeln), 12 Step-ups mit Sprung pro Bein, 20 einbeinige Wadenheben pro Bein, 10 einbeinige Kreuzheben pro Bein, 45 s Unterarmstütz. In einer Entlastungswoche nur 2 Runden.`,
          pl: `${d}. 3 rundy: 8 powolnych przysiadów na jednej nodze ze stopnia na nogę (5 sekund opuszczania: właśnie tak zbiegi obciążają mięśnie czworogłowe), 12 wejść na stopień z wyskokiem na nogę, 20 wspięć na palce jednej nogi na nogę, 10 martwych ciągów na jednej nodze na nogę, 45 s deski. W lżejszym tygodniu tylko 2 rundy.`,
          nl: `${d}. 3 rondes: 8 langzame squats op één been vanaf een trede, per been (5 seconden zakken: precies wat afdalingen met je bovenbenen doen), 12 step-ups met sprong per been, 20 kuitheffingen op één been per been, 10 deadlifts op één been per been, 45 s plank. In een rustigere week maar 2 rondes.`,
          'pt-br': `${d}. 3 voltas de: 8 agachamentos lentos numa perna a partir de um degrau, por perna (5 segundos para descer: é isso que as descidas fazem com o quadríceps), 12 subidas no degrau com salto por perna, 20 elevações de panturrilha numa perna de cada lado, 10 levantamentos terra unilaterais de cada lado, 45 s de prancha. Só 2 voltas na semana regenerativa.`,
        };
      return {
        en: `${d} of mobility: ankle circles and calf stretches, hip openers, 2 × 30 s single-leg balance per leg. Nothing that leaves you sore before the race.`,
        fr: `${d} de mobilité : rotations de chevilles et étirements des mollets, ouverture de hanches, 2 × 30 s d'équilibre sur chaque jambe. Rien qui laisse des courbatures avant la course.`,
        es: `${d} de movilidad: círculos de tobillo y estiramientos de gemelos, apertura de cadera, 2 × 30 s de equilibrio por pierna. Nada que deje agujetas antes de la carrera.`,
        it: `${d} di mobilità: rotazioni delle caviglie e allungamento dei polpacci, apertura delle anche, 2 × 30 s in equilibrio per gamba. Niente che lasci indolenzimenti prima della gara.`,
        de: `${d} Mobilität: Fußkreisen und Wadendehnung, Hüftöffner, 2 × 30 s Einbeinstand pro Bein. Nichts, was dir vor dem Wettkampf Muskelkater macht.`,
        pl: `${d} mobilności: krążenia stóp i rozciąganie łydek, otwieranie bioder, 2 × 30 s stania na jednej nodze na nogę. Nic, po czym przed startem złapiesz zakwasy.`,
        nl: `${d} mobiliteit: enkelcirkels en kuitstretches, heupopeners, 2 × 30 s op één been balanceren per been. Niets waar je voor de wedstrijd spierpijn van krijgt.`,
        'pt-br': `${d} de mobilidade: rotações de tornozelo e alongamento de panturrilha, abertura de quadril, 2 × 30 s de equilíbrio em cada perna. Nada que deixe dor muscular antes da prova.`,
      };
    },
  },
};

/** Short labels written on the watch steps. */
export const STEP: Record<string, Text> = {
  uphill: {
    en: 'Uphill',
    fr: 'Montée',
    es: 'Subida',
    it: 'Salita',
    de: 'Bergauf',
    pl: 'Pod górę',
    nl: 'Bergop',
    'pt-br': 'Subida',
  },
  down: {
    en: 'Jog or walk down',
    fr: 'Redescente au trot',
    es: 'Bajada al trote',
    it: 'Discesa di corsa lenta',
    de: 'Bergab traben/gehen',
    pl: 'Zbieg truchtem/marszem',
    nl: 'Bergaf dribbelen/wandelen',
    'pt-br': 'Descida em trote',
  },
  hike: {
    en: 'Power hike, poles',
    fr: 'Marche rapide, bâtons',
    es: 'Caminar rápido, bastones',
    it: 'Camminata veloce, bastoncini',
    de: 'Power Hiking, Stöcke',
    pl: 'Szybki marsz, kije',
    nl: 'Powerhiken, stokken',
    'pt-br': 'Caminhada rápida, bastões',
  },
  downhill: {
    en: 'Downhill, short quick steps',
    fr: 'Descente, pas courts et rapides',
    es: 'Bajada, pasos cortos y rápidos',
    it: 'Discesa, passi corti e rapidi',
    de: 'Bergab, kurze schnelle Schritte',
    pl: 'Zbieg, krótkie szybkie kroki',
    nl: 'Bergaf, korte snelle passen',
    'pt-br': 'Descida, passos curtos e rápidos',
  },
  hikeUp: {
    en: 'Hike back up',
    fr: 'Remontée en marchant',
    es: 'Subir andando',
    it: 'Risalita a piedi',
    de: 'Bergauf gehen',
    pl: 'Podejście marszem',
    nl: 'Wandelend omhoog',
    'pt-br': 'Subir caminhando',
  },
  raceEffort: {
    en: 'Race effort',
    fr: 'Effort de course',
    es: 'Ritmo de carrera',
    it: 'Ritmo gara',
    de: 'Wettkampfintensität',
    pl: 'Intensywność startowa',
    nl: 'Wedstrijdintensiteit',
    'pt-br': 'Esforço de prova',
  },
  fast: {
    en: 'Fast',
    fr: 'Vite',
    es: 'Rápido',
    it: 'Veloce',
    de: 'Schnell',
    pl: 'Szybko',
    nl: 'Snel',
    'pt-br': 'Rápido',
  },
  jog: {
    en: 'Jog',
    fr: 'Trot',
    es: 'Trote',
    it: 'Corsa lenta',
    de: 'Trab',
    pl: 'Trucht',
    nl: 'Dribbelen',
    'pt-br': 'Trote',
  },
};

// ---------------------------------------------------------------------------
// Weeks, cycles and plan headers
// ---------------------------------------------------------------------------

export const THEME: Record<'light' | 'peak' | 'taper' | 'race', Text> = {
  light: {
    en: 'Lighter week',
    fr: 'Semaine allégée',
    es: 'Semana de descarga',
    it: 'Settimana di scarico',
    de: 'Entlastungswoche',
    pl: 'Lżejszy tydzień',
    nl: 'Rustigere week',
    'pt-br': 'Semana regenerativa',
  },
  peak: {
    en: 'Biggest week',
    fr: 'Semaine la plus chargée',
    es: 'Semana más cargada',
    it: 'Settimana di carico massimo',
    de: 'Umfangreichste Woche',
    pl: 'Najcięższy tydzień',
    nl: 'Zwaarste week',
    'pt-br': 'Semana mais pesada',
  },
  taper: {
    en: 'Taper',
    fr: 'Affûtage',
    es: 'Puesta a punto',
    it: 'Scarico pre-gara',
    de: 'Tapering',
    pl: 'Tapering',
    nl: 'Taperen',
    'pt-br': 'Polimento',
  },
  race: {
    en: 'Race week',
    fr: 'Semaine de course',
    es: 'Semana de carrera',
    it: 'Settimana di gara',
    de: 'Wettkampfwoche',
    pl: 'Tydzień startowy',
    nl: 'Wedstrijdweek',
    'pt-br': 'Semana de prova',
  },
};

export const CYCLE = {
  base: {
    name: {
      en: 'Base',
      fr: 'Bases',
      es: 'Base',
      it: 'Base',
      de: 'Grundlage',
      pl: 'Baza',
      nl: 'Basis',
      'pt-br': 'Base',
    } as Text,
    desc: (light: number): Text => ({
      en: `Easy volume, short hill repeats and the first downhill drills. The long run grows by 10 to 15 minutes a week. Week ${light} is lighter.`,
      fr: `Du volume facile, des côtes courtes et les premiers exercices de descente. La sortie longue gagne 10 à 15 minutes par semaine. La semaine ${light} est allégée.`,
      es: `Volumen suave, cuestas cortas y los primeros ejercicios de bajada. La tirada larga crece de 10 a 15 minutos por semana. La semana ${light} es más ligera.`,
      it: `Volume facile, salite brevi e i primi esercizi di discesa. Il lungo cresce di 10–15 minuti a settimana. La settimana ${light} è di scarico.`,
      de: `Lockerer Umfang, kurze Bergintervalle und erste Bergab-Übungen. Der lange Lauf wächst um 10 bis 15 Minuten pro Woche. Woche ${light} ist leichter.`,
      pl: `Spokojny kilometraż, krótkie podbiegi i pierwsze ćwiczenia zbiegania. Długie wybieganie wydłuża się o 10–15 minut na tydzień. Tydzień ${light} jest lżejszy.`,
      nl: `Rustige omvang, korte heuvelherhalingen en de eerste afdaaloefeningen. De lange duurloop groeit met 10 tot 15 minuten per week. Week ${light} is lichter.`,
      'pt-br': `Volume leve, subidas curtas e os primeiros exercícios de descida. O longão cresce de 10 a 15 minutos por semana. A semana ${light} é mais leve.`,
    }),
  },
  build: {
    name: {
      en: 'Build',
      fr: 'Développement',
      es: 'Desarrollo',
      it: 'Costruzione',
      de: 'Aufbau',
      pl: 'Budowanie',
      nl: 'Opbouw',
      'pt-br': 'Desenvolvimento',
    } as Text,
    desc: (light: number | null): Text => ({
      en:
        'Longer hill repeats and uphill tempo, power hiking with poles, more D+ on the long run.' +
        (light ? ` Week ${light} is lighter so the work can sink in.` : ''),
      fr:
        'Côtes plus longues et montées au seuil, rando-course avec bâtons, plus de D+ en sortie longue.' +
        (light ? ` La semaine ${light} est allégée pour assimiler.` : ''),
      es:
        'Cuestas más largas y subidas a umbral, caminar rápido con bastones y más desnivel en la tirada larga.' +
        (light ? ` La semana ${light} es más ligera para asimilar.` : ''),
      it:
        'Ripetute in salita più lunghe e salite a soglia, camminata veloce con i bastoncini, più dislivello nel lungo.' +
        (light ? ` La settimana ${light} è di scarico per assimilare.` : ''),
      de:
        'Längere Bergintervalle und Schwellenläufe bergauf, Power Hiking mit Stöcken, mehr Hm im langen Lauf.' +
        (light
          ? ` Woche ${light} ist leichter, damit sich das Training setzen kann.`
          : ''),
      pl:
        'Dłuższe podbiegi i podbiegi progowe, szybki marsz z kijami, więcej przewyższenia w długim wybieganiu.' +
        (light
          ? ` Tydzień ${light} jest lżejszy, żeby trening mógł się utrwalić.`
          : ''),
      nl:
        'Langere heuvelherhalingen en drempelklimmen, powerhiken met stokken, meer hoogtemeters in de lange duurloop.' +
        (light
          ? ` Week ${light} is lichter, zodat je de training kunt verwerken.`
          : ''),
      'pt-br':
        'Subidas mais longas e subidas no limiar, caminhada rápida com bastões e mais altimetria no longão.' +
        (light ? ` A semana ${light} é mais leve para assimilar.` : ''),
    }),
  },
  specific: {
    name: {
      en: 'Race-specific',
      fr: 'Spécifique',
      es: 'Específico',
      it: 'Specifico',
      de: 'Wettkampfspezifisch',
      pl: 'Przygotowanie specjalne',
      nl: 'Wedstrijdspecifiek',
      'pt-br': 'Específico',
    } as Text,
    desc: (
      peakMin: number,
      peakDplus: number,
      b2b: boolean,
      light: number | null,
    ): Text =>
      each((l) => {
        const p = dur(peakMin);
        const dp = num(l, peakDplus);
        const parts = {
          en: [
            `The biggest weeks: the long run reaches ${p} with ${dp} m D+, with time at race effort.`,
            b2b &&
              'Saturday and Sunday become back-to-back long runs, to learn to run on tired legs.',
            light && `Week ${light} is lighter.`,
          ],
          fr: [
            `Les plus grosses semaines : la sortie longue monte à ${p} avec ${dp} m D+, dont une partie à l'effort de course.`,
            b2b &&
              "Samedi et dimanche s'enchaînent en sorties longues, pour apprendre à courir sur des jambes fatiguées.",
            light && `La semaine ${light} est allégée.`,
          ],
          es: [
            `Las semanas más duras: la tirada larga llega a ${p} con ${dp} m D+, con tramos a ritmo de carrera.`,
            b2b &&
              'Sábado y domingo se convierten en tiradas largas encadenadas, para aprender a correr con las piernas cansadas.',
            light && `La semana ${light} es más ligera.`,
          ],
          it: [
            `Le settimane più impegnative: il lungo arriva a ${p} con ${dp} m D+, con tratti a ritmo gara.`,
            b2b &&
              'Sabato e domenica diventano lunghi in back-to-back, per imparare a correre con le gambe stanche.',
            light && `La settimana ${light} è di scarico.`,
          ],
          de: [
            `Die umfangreichsten Wochen: Der lange Lauf erreicht ${p} mit ${dp} Hm, mit Abschnitten in Wettkampfintensität.`,
            b2b &&
              'Samstag und Sonntag werden zu langen Läufen an zwei Tagen hintereinander, damit du lernst, auf müden Beinen zu laufen.',
            light && `Woche ${light} ist leichter.`,
          ],
          pl: [
            `Najcięższe tygodnie: długie wybieganie dochodzi do ${p} i ${dp} m przewyższenia, z odcinkami w intensywności startowej.`,
            b2b &&
              'Sobota i niedziela to długie wybiegania dzień po dniu, żeby nauczyć się biegać na zmęczonych nogach.',
            light && `Tydzień ${light} jest lżejszy.`,
          ],
          nl: [
            `De zwaarste weken: de lange duurloop groeit naar ${p} met ${dp} hoogtemeters, met stukken op wedstrijdintensiteit.`,
            b2b &&
              'Zaterdag en zondag worden back-to-back lange duurlopen, zodat je leert lopen op vermoeide benen.',
            light && `Week ${light} is lichter.`,
          ],
          'pt-br': [
            `As semanas mais pesadas: o longão chega a ${p} com ${dp} m D+, com trechos no esforço de prova.`,
            b2b &&
              'Sábado e domingo viram longões encadeados, para aprender a correr com as pernas cansadas.',
            light && `A semana ${light} é mais leve.`,
          ],
        }[l];
        return parts.filter(Boolean).join(' ');
      }),
  },
  taper: {
    name: {
      en: 'Taper',
      fr: 'Affûtage',
      es: 'Puesta a punto',
      it: 'Scarico pre-gara',
      de: 'Tapering',
      pl: 'Tapering',
      nl: 'Taperen',
      'pt-br': 'Polimento',
    } as Text,
    desc: {
      en: 'Two weeks to arrive fresh: volume drops by about a third, then by half, while a few short efforts keep the legs sharp. Nothing new, plenty of sleep.',
      fr: "Deux semaines pour arriver frais : le volume baisse d'environ un tiers, puis de moitié, et quelques efforts courts gardent les jambes vives. Rien de nouveau, beaucoup de sommeil.",
      es: 'Dos semanas para llegar fresco: el volumen baja cerca de un tercio y luego a la mitad, con algunos esfuerzos cortos para mantener las piernas despiertas. Nada nuevo y mucho sueño.',
      it: 'Due settimane per arrivare freschi: il volume cala di circa un terzo, poi della metà, con qualche sforzo breve per tenere le gambe reattive. Niente di nuovo, tanto sonno.',
      de: 'Zwei Wochen, um frisch anzukommen: Der Umfang sinkt um etwa ein Drittel, dann um die Hälfte, während ein paar kurze Belastungen die Beine spritzig halten. Nichts Neues, viel Schlaf.',
      pl: 'Dwa tygodnie na odzyskanie świeżości: kilometraż spada o mniej więcej jedną trzecią, potem o połowę, a kilka krótkich akcentów utrzymuje szybkość w nogach. Nic nowego, dużo snu.',
      nl: 'Twee weken om fris aan de start te staan: de omvang daalt met ongeveer een derde, daarna met de helft, terwijl een paar korte inspanningen je benen scherp houden. Niets nieuws, veel slapen.',
      'pt-br':
        'Duas semanas para chegar descansado: o volume cai cerca de um terço, depois pela metade, com alguns esforços curtos para manter as pernas acordadas. Nada de novo e muito sono.',
    } as Text,
  },
};

export const PLAN = {
  name: (km: number, dplus: number, weeks: number): Text =>
    each((l) => {
      const dp = num(l, dplus);
      return {
        en: `Trail ${km} km, ${dp} m D+: ${weeks}-week plan`,
        fr: `Trail ${km} km ${dp} D+ : plan de ${weeks} semaines`,
        es: `Trail ${km} km y ${dp} m D+: plan de ${weeks} semanas`,
        it: `Trail ${km} km, ${dp} m D+: tabella di ${weeks} settimane`,
        de: `Trail ${km} km, ${dp} Hm: Trainingsplan für ${weeks} Wochen`,
        pl: `Trail ${km} km, ${dp} m przewyższenia: plan na ${weeks} ${plPlural(weeks, 'tydzień', 'tygodnie', 'tygodni')}`,
        nl: `Trail ${km} km, ${dp} hm: trainingsschema van ${weeks} weken`,
        'pt-br': `Trail ${km} km, ${dp} m D+: planilha de ${weeks} semanas`,
      }[l];
    }),
  goal: (km: number, dplus: number): Text =>
    each((l) => {
      const dp = num(l, dplus);
      return {
        en: `Finish a ${km} km trail race with ${dp} m D+`,
        fr: `Finir un trail de ${km} km et ${dp} m D+`,
        es: `Terminar un trail de ${km} km y ${dp} m D+`,
        it: `Finire un trail di ${km} km e ${dp} m D+`,
        de: `Einen Trail über ${km} km mit ${dp} Hm finishen`,
        pl: `Ukończyć bieg trailowy na ${km} km z ${dp} m przewyższenia`,
        nl: `Een trail van ${km} km met ${dp} hoogtemeters uitlopen`,
        'pt-br': `Completar um trail de ${km} km e ${dp} m D+`,
      }[l];
    }),
  description: (p: {
    km: number;
    dplus: number;
    weeks: number;
    runs: string;
    peakMin: number;
    peakDplus: number;
    b2b: boolean;
  }): Text =>
    each((l) => {
      const dp = num(l, p.dplus);
      const peak = dur(p.peakMin);
      const pdp = num(l, p.peakDplus);
      return {
        en:
          `A ${p.weeks}-week plan for a ${p.km} km trail race with about ${dp} m of climbing, on ${p.runs} runs a week plus optional strength. Hill repeats, uphill tempo, power hiking with poles and downhill technique. The long run grows to ${peak} and ${pdp} m D+, with a lighter week every 3–4 weeks and a 2-week taper.` +
          (p.b2b ? ' Weekends turn into back-to-back long runs.' : ''),
        fr:
          `Un plan de ${p.weeks} semaines pour un trail de ${p.km} km et environ ${dp} m D+, sur ${p.runs} sorties par semaine plus du renforcement facultatif. Côtes, montées au seuil, rando-course avec bâtons et descente technique. La sortie longue monte jusqu'à ${peak} et ${pdp} m D+, avec une semaine allégée toutes les 3–4 semaines et 2 semaines d'affûtage.` +
          (p.b2b
            ? ' Les week-ends deviennent des sorties longues enchaînées.'
            : ''),
        es:
          `Un plan de ${p.weeks} semanas para un trail de ${p.km} km con unos ${dp} m D+, con ${p.runs} salidas por semana y fuerza opcional. Cuestas, subidas a umbral, caminar rápido con bastones y técnica de bajada. La tirada larga llega a ${peak} y ${pdp} m D+, con una semana de descarga cada 3–4 semanas y 2 semanas de puesta a punto.` +
          (p.b2b
            ? ' Los fines de semana pasan a ser tiradas largas encadenadas.'
            : ''),
        it:
          `Una tabella di ${p.weeks} settimane per un trail di ${p.km} km con circa ${dp} m D+, con ${p.runs} uscite a settimana più forza facoltativa. Ripetute in salita, salite a soglia, camminata veloce con i bastoncini e tecnica di discesa. Il lungo con dislivello arriva a ${peak} e ${pdp} m D+, con una settimana di scarico ogni 3–4 settimane e 2 settimane di scarico pre-gara.` +
          (p.b2b ? ' I fine settimana diventano lunghi in back-to-back.' : ''),
        de:
          `Ein Trainingsplan über ${p.weeks} Wochen für einen Trail über ${p.km} km mit etwa ${dp} Hm, mit ${p.runs} Läufen pro Woche plus optionalem Krafttraining. Bergintervalle, Schwellenläufe bergauf, Power Hiking mit Stöcken und Bergab-Technik. Der lange Lauf wächst auf ${peak} und ${pdp} Hm, mit einer Entlastungswoche alle 3–4 Wochen und 2 Wochen Tapering.` +
          (p.b2b
            ? ' Am Wochenende werden daraus lange Läufe an zwei Tagen hintereinander.'
            : ''),
        pl:
          `Plan na ${p.weeks} ${plPlural(p.weeks, 'tydzień', 'tygodnie', 'tygodni')} do biegu trailowego na ${p.km} km z około ${dp} m przewyższenia: ${p.runs} ${plPlural(lastNumber(p.runs), 'bieg', 'biegi', 'biegów')} w tygodniu plus opcjonalny trening siłowy. Podbiegi, podbiegi progowe, szybki marsz z kijami i technika zbiegania. Długie wybieganie rośnie do ${peak} i ${pdp} m przewyższenia, z lżejszym tygodniem co 3–4 tygodnie i 2 tygodniami taperingu.` +
          (p.b2b
            ? ' W weekendy pojawiają się długie wybiegania dzień po dniu.'
            : ''),
        nl:
          `Een trainingsschema van ${p.weeks} weken voor een trail van ${p.km} km met ongeveer ${dp} hoogtemeters, met ${p.runs} looptrainingen per week plus optionele krachttraining. Heuvelherhalingen, drempelklimmen, powerhiken met stokken en afdaaltechniek. De lange duurloop groeit naar ${peak} en ${pdp} hoogtemeters, met een rustigere week om de 3–4 weken en 2 weken taperen.` +
          (p.b2b
            ? ' In het weekend worden het back-to-back lange duurlopen.'
            : ''),
        'pt-br':
          `Uma planilha de ${p.weeks} semanas para um trail de ${p.km} km com cerca de ${dp} m D+, com ${p.runs} corridas por semana e fortalecimento opcional. Subidas, subidas no limiar, caminhada rápida com bastões e técnica de descida. O longão com altimetria chega a ${peak} e ${pdp} m D+, com uma semana mais leve a cada 3–4 semanas e 2 semanas de polimento.` +
          (p.b2b ? ' Os fins de semana viram longões encadeados.' : ''),
      }[l];
    }),
};

/** "4", "4 to 5" in words for the plan description. */
export function runsLabel(locale: Locale, min: number, max: number): string {
  if (min === max) return String(min);
  const to = {
    en: 'to',
    fr: 'à',
    es: 'a',
    it: 'o',
    'pt-br': 'a',
    de: 'bis',
    pl: 'lub',
    nl: 'tot',
  }[locale];
  return `${min} ${to} ${max}`;
}

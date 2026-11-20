import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        Je spieren maken bij elk tempo lactaat aan, zelfs bij wandelen, en
        ruimen het net zo gestaag weer op. Bij rustige snelheden houden die twee
        elkaar in evenwicht en blijft de concentratie in je bloed dicht bij je
        rustwaarde, rond 1 mmol/l. Versnel en op een gegeven moment loopt de
        aanmaak voor op de afbraak. Dat punt bedoelen mensen met de
        lactaatdrempel, en het is de reden dat een tempo dat je een uur volhoudt
        zo anders voelt dan een tempo dat maar 15 seconden per kilometer sneller
        is.
      </p>
      <p>
        Het probleem is dat ‘de’ lactaatdrempel niet bestaat als één afgesproken
        getal. Faude, Kindermann en Meyer (2009) bekeken meer dan twintig
        drempelconcepten uit de literatuur, gebaseerd op verschillende
        protocollen en verschillende regels om dezelfde curve af te lezen. In de
        praktijk vallen ze in twee families. De eerste drempel (LT1, vaak de
        aerobe drempel genoemd) is waar lactaat voor het eerst boven het
        rustniveau stijgt. De tweede (LT2, de anaerobe drempel of, in de
        strengste vorm, de maximale lactaat-steady-state) is de hoogste
        intensiteit waarbij lactaat zich nog op een stabiele waarde instelt in
        plaats van te blijven stijgen tot je stopt. Als een trainer
        ‘drempelloop’ zegt, bedoelt hij bijna altijd LT2.
      </p>

      <h2>Zo wordt hij gemeten</h2>
      <p>
        De klassieke test is een stappentest op een loopband of een baan:
        trappen van 3 tot 5 minuten, elk 0,5 tot 1 km/u sneller dan de vorige,
        met aan het eind van elke trap een druppel bloed uit een vingertop of
        oorlel. Daarna lees je de drempel af van de curve. Twee regels zijn
        gangbaar: een vaste concentratie, meestal 4 mmol/l voor LT2, en een
        stijging boven de basiswaarde, vaak basiswaarde + 1 mmol/l voor LT1. De
        snelheid tussen twee trappen vind je met lineaire interpolatie:
      </p>
      <Formula
        where={[
          'La = doellactaat (4 mmol/l, of basiswaarde + 1)',
          'v1, La1 = snelheid en lactaat van de laatste trap onder het doel',
          'v2, La2 = snelheid en lactaat van de eerste trap erboven',
        ]}
      >
        v = v1 + (La − La1) / (La2 − La1) × (v2 − v1)
      </Formula>
      <p>
        De maximale lactaat-steady-state is de referentie die de andere methoden
        proberen te benaderen, maar om hem vast te stellen heb je meerdere dagen
        met loopjes van 30 minuten op constant tempo nodig, en daarom meten maar
        weinig mensen buiten een lab hem ooit (Jones et al., 2019).
      </p>

      <h2>Een rekenvoorbeeld</h2>
      <p>
        Een loper doet trappen van 4 minuten vanaf 10 km/u en voegt telkens 1
        km/u toe. Lactaat aan het eind van elke trap: 1,1, 1,2, 1,4, 1,8, 2,6,
        4,1 en 6,3 mmol/l bij 10, 11, 12, 13, 14, 15 en 16 km/u.
      </p>
      <ul>
        <li>
          LT2 bij 4 mmol/l: tussen 14 km/u (2,6) en 15 km/u (4,1). v = 14 + (4 −
          2,6) / (4,1 − 2,6) × 1 = 14,9 km/u, oftewel 4:01 per km.
        </li>
        <li>
          LT1 bij basiswaarde + 1: de laagste waarde is 1,1, dus het doel is 2,1
          mmol/l, tussen 13 km/u (1,8) en 14 km/u (2,6). v = 13 + 0,3 / 0,8 =
          13,4 km/u, oftewel 4:29 per km.
        </li>
      </ul>
      <p>
        Dezelfde test, hetzelfde bloed, en de twee drempels liggen bijna 30
        seconden per kilometer uit elkaar. Lees de curve af met een andere regel
        (bijvoorbeeld het punt met de grootste afstand tot een lijn tussen de
        eerste en de laatste trap) en je krijgt weer een andere waarde. Dat is
        geen fout van de test; het is de reden om altijd te vragen naar welke
        drempel een getal verwijst.
      </p>

      <h2>Zo gebruik je hem in je training</h2>
      <p>
        Zonder lab is een goede veldschatting van LT2 het tempo dat je ongeveer
        een uur in een wedstrijd kunt volhouden, en dat ligt voor de meeste
        getrainde lopers tussen hun 10 km- en halvemarathontempo. De{' '}
        <Link href="/nl/pace-charts">tempotabellen</Link> geven dat tempo op
        basis van een recente wedstrijdtijd. De hartslag op LT2 ligt meestal op
        85 tot 92% van je maximum, maar de spreiding tussen personen is groot.
      </p>
      <ul>
        <li>
          Drempeltrainingen: 3 × 10' of 5 × 6' op LT2-tempo met 1 tot 2 minuten
          dribbelen, of 20 tot 30 minuten aaneen. Het tempo moet ‘comfortabel
          zwaar’ voelen: je kunt een paar woorden zeggen, geen hele zin.
        </li>
        <li>
          Rustig lopen blijft onder LT1. Dat plafond probeert{' '}
          <Link href="/nl/learn/zone-2">zone 2</Link> te vangen, en in een{' '}
          <Link href="/nl/learn/polarized-training">gepolariseerde</Link> week
          breng je daar de meeste minuten door.
        </li>
        <li>
          Test elke 6 tot 10 weken opnieuw, of gebruik wedstrijden: de drempel
          verschuift met je conditie, en oude zones komen op de verkeerde plek
          te liggen.
        </li>
      </ul>
      <p>
        OpenAthlete meet geen lactaat. Je voert je zones in of synchroniseert
        ze, en de statistieken laten zien hoe je tijd zich over weken en maanden
        verdeelt onder, tussen en boven je drempels, naast de curves van je{' '}
        <Link href="/nl/features/training-load">trainingsbelasting</Link>.
      </p>

      <h2>Beperkingen</h2>
      <p>
        Het getal hangt af van het protocol: kortere trappen geven een hogere
        drempelsnelheid, omdat het lactaat nog niet bij is als het bloed wordt
        afgenomen. Draagbare lactaatmeters verschillen onderling een paar
        tienden van een mmol/l, wat een drempel met een vaste waarde op een vlak
        deel van de curve flink verschuift. Weinig spierglycogeen verlaagt het
        lactaat bij elke snelheid en laat de drempel beter lijken dan hij is. En
        een snelheid die op een loopband bij 18 °C is gevonden, laat zich niet
        zomaar overzetten naar een heuvelachtig parcours in de hitte. Wil je een
        tempo-ankerpunt dat uit je eigen wedstrijden komt in plaats van uit een
        bloedmonster, kijk dan naar de{' '}
        <Link href="/nl/learn/critical-speed">kritische snelheid</Link>, die net
        boven de maximale lactaat-steady-state ligt.
      </p>
    </div>
  );
}

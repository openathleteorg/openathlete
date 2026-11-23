import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        Zone 2 is het rustige, gelijkmatige lopen dat het grootste deel van een
        verstandige trainingsweek vult: het tempo van lange duurlopen en
        hersteldagen, waarbij je nog in volzinnen kunt praten. De naam komt van
        de hartslagschaal met vijf zones die de meeste horloges en trainingsapps
        gebruiken, waar zone 2 ligt tussen heel rustig dribbelen (zone 1) en de
        matige, “comfortabel zware” zone 3. Fysiologisch komt het overeen met
        intensiteiten op of net onder de eerste lactaatdrempel, waar het
        bloedlactaat nauwelijks boven rustwaarden ligt en je de inspanning
        urenlang kunt volhouden.
      </p>
      <p>
        De laatste jaren is zone 2 in de mode geraakt, vooral door discussies
        over de werking van mitochondriën en vetverbranding. Het onderliggende
        advies is veel ouder: duursporters in de meeste sporten brengen het
        grootste deel van hun trainingstijd door op lage intensiteit, zoals de
        overzichten van Stephen Seiler over de training van topsporters laten
        zien (Seiler, 2010).
      </p>

      <h2>Hoe zone 2 wordt berekend</h2>
      <p>
        Er is geen eenduidige definitie, en dat is de bron van de meeste
        verwarring. De gangbare hartslagversie gebruikt de methode van Karvonen,
        op basis van je{' '}
        <Link href="/nl/learn/heart-rate-reserve">hartslagreserve</Link>:
      </p>
      <Formula
        where={[
          'HSrust: rusthartslag, liggend gemeten bij het wakker worden',
          'HSmax: de hoogste hartslag die je echt hebt gezien, liefst geen formule op basis van leeftijd',
        ]}
      >
        Zone 2 = HSrust + (0,60 tot 0,70) × (HSmax − HSrust)
      </Formula>
      <p>
        De eenvoudigere variant neemt 60 tot 70% van de maximale hartslag. In
        een lab wordt zone 2 juist vastgepind op gemeten markers: de eerste
        lactaat- of ventilatoire drempel. Percentages zijn een vervanging voor
        die drempels, en een grove.
      </p>
      <p>
        Eén valkuil: in het driezonemodel dat in onderzoek wordt gebruikt
        (Seiler en anderen) is zone 1 alles onder de eerste drempel en is zone 2
        de band tussen de eerste en de tweede drempel. Die “zone 2” is
        tempolopen, geen rustig lopen. Kijk bij het lezen van een studie dus
        welke schaal ze gebruikt.
      </p>

      <h2>Een rekenvoorbeeld</h2>
      <p>
        Een loper heeft een rusthartslag van 50 bpm en heeft 190 bpm gezien aan
        het eind van een zware heuveltraining. Zijn hartslagreserve is 140
        slagen.
      </p>
      <ul>
        <li>Ondergrens van zone 2: 50 + 0,60 × 140 = 134 bpm</li>
        <li>Bovengrens van zone 2: 50 + 0,70 × 140 = 148 bpm</li>
        <li>
          Met 60–70% van het maximum: 0,60 × 190 = 114 tot 0,70 × 190 = 133 bpm
        </li>
      </ul>
      <p>
        De twee methoden overlappen nauwelijks. Voor een fitte loper met een
        lage rusthartslag ligt 114 bpm dicht bij wandelen, en de zone op basis
        van het maximum valt grotendeels in zone 1. Daarom is Karvonen voor
        lopers meestal de betere keuze, en daarom gebruikt de{' '}
        <Link href="/nl/tools/heart-rate-zones">
          calculator voor hartslagzones
        </Link>{' '}
        die standaard.
      </p>
      <p>
        Een tweede loper, met een rusthartslag van 60 en een maximum van 180,
        komt uit op 132 tot 144 bpm. Vergelijkbare getallen, heel verschillende
        mensen: zones hebben alleen zin met je eigen rust- en maximale waarden.
      </p>

      <h2>Hoe je zone 2 in je training gebruikt</h2>
      <p>
        Voor de meeste lopers die vier tot zes keer per week trainen, hoort het
        overgrote deel van de looptijd in zone 1 en 2, met een of twee zwaardere
        trainingen erbovenop. In de praktijk:
      </p>
      <ul>
        <li>
          Rustige dagen: 40 tot 70 minuten in zone 2, de dag na een zware
          training het liefst aan de onderkant.
        </li>
        <li>
          Lange duurloop: 1u30 tot 2u30, grotendeels in zone 2. De hartslag
          kruipt omhoog naarmate je moe en warm wordt; accepteer een paar slagen
          drift in plaats van te vertragen tot sloffen, en noteer hoeveel hij
          oploopt, want dat zegt iets over je uithoudingsvermogen (zie{' '}
          <Link href="/nl/learn/aerobic-decoupling">aerobe ontkoppeling</Link>
          ).
        </li>
        <li>
          Wandel op heuvelachtig terrein de steile klimmen als je zo in de zone
          blijft. Trailrunners doen dat in wedstrijden toch al.
        </li>
        <li>
          Meet je vooruitgang met een vaste referentie: om de paar weken
          hetzelfde vlakke rondje op dezelfde hartslag. Wordt je tempo bij 140
          bpm sneller, dan verbetert je aerobe basis.
        </li>
      </ul>
      <p>
        De praattest is een handige controle. Krijg je maar een paar woorden
        tegelijk uit je mond, dan zit je boven zone 2, wat je horloge ook zegt.
      </p>
      <p>
        In OpenAthlete kun je hartslagzones instellen als percentage van het
        maximum of van de hartslagreserve, per sport, en elke activiteit toont
        de tijd in elke zone. De{' '}
        <Link href="/nl/features/training-load">
          pagina over trainingsbelasting
        </Link>{' '}
        legt uit hoe hartslag ook de <Link href="/nl/learn/trimp">TRIMP</Link>{' '}
        van elke training voedt.
      </p>

      <h2>Beperkingen</h2>
      <p>
        Percentagezones gaan ervan uit dat ieders eerste drempel op hetzelfde
        deel van de hartslagreserve ligt. Dat klopt niet: bij getrainde lopers
        kan die duidelijk boven 70% liggen, bij beginners lager. Een drempeltest
        in het lab of op het veld geeft je betere grenzen dan welk percentage
        ook.
      </p>
      <p>
        De maximale hartslag is de zwakke schakel. Leeftijdsformules zoals die
        van Tanaka (208 − 0,7 × leeftijd) beschrijven een populatiegemiddelde en
        zitten bij veel mensen 10 slagen of meer naast, wat de hele zone
        verschuift. Hitte, uitdroging, slecht slapen en cafeïne verhogen
        allemaal de hartslag bij hetzelfde tempo, en op korte klimmetjes loopt
        de hartslag achter op de inspanning.
      </p>
      <p>
        Houd de beweringen tot slot in verhouding. Veel van het recente
        enthousiasme over zone 2, mitochondriën en vetverbranding rust op
        vergelijkingen tussen profwielrenners en minder fitte mensen (San-Millán
        en Brooks, 2018), die laten zien hoe getrainde sporters verschillen,
        niet wat een bepaalde hoeveelheid zone 2 voor jou zal doen. Rustig
        volume werkt; een beetje intensiteit erbovenop ook, en dat is precies
        het punt van{' '}
        <Link href="/nl/learn/polarized-training">gepolariseerd trainen</Link>.
      </p>
    </div>
  );
}

import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        CTL, ATL en TSB zijn drie curves die uit dezelfde dagelijkse
        trainingsbelasting worden berekend. CTL (chronic training load) heet
        meestal fitheid, ATL (acute training load) vermoeidheid en TSB (training
        stress balance) vorm. Ze komen uit het impuls-responsmodel dat Eric
        Banister in 1975 publiceerde: elke training verhoogt zowel je fitheid
        als je vermoeidheid, vermoeidheid verdwijnt binnen enkele dagen, fitheid
        over weken, en je prestatie zit ergens in het verschil tussen die twee.
        De namen CTL, ATL en TSB werden later populair door fietssoftware, maar
        de wiskunde is van Banister.
      </p>

      <h2>Zo worden ze berekend</h2>
      <p>
        Begin met één belastingscijfer per dag, bijvoorbeeld de som van de{' '}
        <Link href="/nl/learn/trimp">TRIMP</Link> van de trainingen van die dag
        (0 op een rustdag). Fitheid en vermoeidheid zijn exponentieel gewogen
        gemiddelden van die reeks, met verschillende tijdconstanten:
      </p>
      <Formula
        where={[
          'CTL: τ = 42 dagen, dus elke dag weegt 1 − e^(−1/42) ≈ 0,0235',
          'ATL: τ = 7 dagen, dus elke dag weegt 1 − e^(−1/7) ≈ 0,133',
          'TSB = CTL − ATL',
        ]}
      >
        vandaag = gisteren + (1 − e^(−1/τ)) × (belasting − gisteren)
      </Formula>
      <p>
        Met τ = 42 dagen halveert het effect van een training op CTL in ongeveer
        29 dagen; op ATL halveert het in minder dan 5 dagen. Sommige tools
        gebruiken de snelkoppeling van het voortschrijdend gemiddelde, 2 / (N +
        1), als dagelijks gewicht. Dat is niet hetzelfde model: met N = 42 geeft
        het 0,047, twee keer 0,0235, waardoor beide tijdconstanten in feite
        halveren en de curves veel sneller reageren (Clarke en Skiba, 2013,
        lopen de afleiding door).
      </p>
      <p>
        Tools verschillen ook in welke dag TSB gebruikt. OpenAthlete trekt de
        waarden van dezelfde dag van elkaar af, nadat de belasting van die dag
        is meegeteld; andere gebruiken de waarden van gisteren, zodat TSB
        beschrijft hoe fris je aan de training van vandaag begint. Op dezelfde
        data kunnen die twee een paar punten verschillen, dus vergelijk geen
        cijfers tussen apps.
      </p>

      <h2>Een rekenvoorbeeld</h2>
      <p>
        Een loper zit al maanden op gemiddeld 60 TRIMP per dag: CTL en ATL staan
        allebei op 60, TSB op 0. Dan begint een zware week van 90 per dag. Na de
        eerste dag:
      </p>
      <ul>
        <li>CTL = 60 + 0,0235 × (90 − 60) = 60,7</li>
        <li>ATL = 60 + 0,133 × (90 − 60) = 64,0</li>
        <li>TSB = 60,7 − 64,0 = −3,3</li>
      </ul>
      <p>
        Na zeven dagen op 90 is CTL opgekropen naar 64,6, terwijl ATL naar 79,0
        is gesprongen: TSB staat op −14,4. De loper is iets fitter en duidelijk
        moe. Daarna zakt hij een week naar 40 per dag. ATL daalt snel naar 54,3,
        CTL zakt maar tot 60,8, en TSB wordt positief: +6,5. Die asymmetrie,
        vermoeidheid die sneller verdwijnt dan fitheid, is het hele principe van
        een <Link href="/nl/learn/taper">taper</Link>.
      </p>

      <h2>Zo gebruik je ze in je training</h2>
      <p>
        CTL vertelt hoeveel training je de afgelopen maand of twee hebt
        verwerkt. Een gestage stijging van een paar punten per week tijdens een
        opbouw is het gebruikelijke beeld; een scherpe sprong verdient een
        kritische blik, een lang plateau ook als je vooruitgang verwachtte. ATL
        beweegt met elke week mee en verklaart vooral waarom je benen zwaar
        voelen. TSB is het getal waar mensen voor een wedstrijd naar kijken: de
        meeste sporters presteren goed ergens tussen licht negatief en duidelijk
        positief, maar de juiste waarde is persoonlijk en die leer je alleen
        kennen door je TSB te noteren voor wedstrijden die goed en slecht
        gingen.
      </p>
      <p>
        De curves worden nuttiger als ze de toekomst in lopen. Hebben je
        geplande trainingen een geschatte belasting, dan kan het model CTL, ATL
        en TSB doortrekken tot de wedstrijddag en laten zien of de laatste twee
        weken je echt fris aan de start brengen. OpenAthlete doet dat: het
        berekent de curves uit je activiteiten en trekt ze door over de
        trainingen in je kalender. Het markeert een TSB onder −20 of boven +25;
        die grenzen zijn afspraken om de curve te beschrijven, geen gevalideerde
        limieten. Op de{' '}
        <Link href="/nl/features/training-load">
          pagina over trainingsbelasting
        </Link>{' '}
        vind je de details en de code.
      </p>

      <h2>Beperkingen</h2>
      <p>
        Het model is zo goed als de dagelijkse belasting die je het voedt.
        Hartslag-TRIMP onderschat sprints, krachttraining en bergaf lopen, dus
        de curves missen een deel van wat een trailrunner of triatleet in de
        sportschool doet. Ontbrekende data doen ook pijn: een week lopen zonder
        hartslagband ziet eruit als een week rust.
      </p>
      <p>
        De tijdconstanten zijn afspraken. Banister paste ze per sporter aan, en
        de gevonden waarden lopen sterk uiteen; 42 en 7 dagen zijn redelijke
        standaardwaarden, niet jouw fysiologie. Hellard en collega’s (2006)
        lieten zien hoe instabiel de aangepaste parameters zijn, zelfs met goede
        data van topzwemmers. En niets in het model weet van slaap, ziekte of
        stress buiten de sport. Een negatieve TSB is geen diagnose van
        overreaching, en een hoge betekent niet dat je klaar bent. Lees de
        curves samen met <Link href="/nl/learn/session-rpe">sessie-RPE</Link>,{' '}
        <Link href="/nl/learn/hrv">HRV</Link> en hoe je je voelt.
      </p>
    </div>
  );
}

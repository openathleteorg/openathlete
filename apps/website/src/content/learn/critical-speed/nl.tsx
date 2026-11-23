import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        Zet je beste tijden van een paar minuten tot ongeveer twintig minuten
        uit tegen de afgelegde afstand, en de punten liggen bijna op een rechte
        lijn. De helling van die lijn is je kritische snelheid (critical speed,
        CS): de snelheid die je meter na meter toevoegt voor elke extra seconde
        inspanning. De lijn begint niet bij nul. Ze snijdt de afstandsas iets
        daarboven, bij een waarde die D′ (D-accent) heet: een vaste hoeveelheid
        afstand die je sneller dan je kritische snelheid kunt afleggen voordat
        je moet vertragen.
      </p>
      <p>
        Het idee komt van Monod en Scherrer (1965), die het beschreven voor het
        werk van een spiergroep, onder de naam kritisch vermogen. Het laat zich
        vertalen naar hardlopen met snelheid in plaats van vermogen en afstand
        in plaats van arbeid. Fysiologisch is de kritische snelheid de grens
        tussen inspanningen waarbij zuurstofopname en lactaat zich op een
        stabiel niveau instellen, en inspanningen waarbij ze blijven stijgen tot
        je stopt (Poole et al., 2016). Ze ligt dicht bij, en iets boven, de
        maximale lactaat-steady-state die de{' '}
        <Link href="/nl/learn/lactate-threshold">lactaatdrempel</Link> probeert
        te benaderen.
      </p>

      <h2>Zo bereken je de kritische snelheid</h2>
      <Formula
        where={[
          'd = afstand van een beste prestatie (m), t = de duur ervan (s)',
          'CS = kritische snelheid (m/s), D′ = afstand boven CS (m)',
          'Boven CS: tijd tot uitputting t = D′ / (v − CS)',
        ]}
      >
        d = D′ + CS × t
      </Formula>
      <p>
        Met twee maximale inspanningen los je de lijn met de hand op. Met drie
        of meer pas je haar aan met de kleinste-kwadratenmethode, en de
        spreiding van de punten rond de lijn vertelt hoeveel je de helling kunt
        vertrouwen. De inspanningen moeten ongeveer 2 tot 20 minuten duren:
        kortere leunen op sprintkwaliteiten die het model niet beschrijft,
        langere brengen vermoeidheid en voeding in het spel.
      </p>

      <h2>Een rekenvoorbeeld</h2>
      <p>
        Een loper heeft vier recente toptijden: 1000 m in 3:10 (190 s), 2000 m
        in 6:55 (415 s), 3000 m in 10:30 (630 s) en 5000 m in 18:00 (1080 s).
      </p>
      <ul>
        <li>
          Afstand tegen tijd uitzetten geeft een helling van 4,50 m/s: de
          kritische snelheid is 16,2 km/u, oftewel 3:42 per km.
        </li>
        <li>Het snijpunt is D′ ≈ 145 m.</li>
        <li>
          Met vier punten is het 95%-interval op de helling ±0,11 m/s, dus de
          kritische snelheid ligt ergens tussen 3:37 en 3:48 per km.
        </li>
        <li>
          Op 3:20 per km (5,0 m/s) is D′ op na 145 / (5,0 − 4,50) ≈ 290 s,
          ongeveer 1450 m. Het model voorspelt een 1500 m in zo’n 5:01.
        </li>
      </ul>
      <p>
        Merk op dat het 5 km-tempo (3:36 per km) sneller is dan de kritische
        snelheid. Dat klopt: elke wedstrijd die kort genoeg is om te finishen
        voordat D′ op is, loop je erboven.
      </p>

      <h2>Zo gebruik je het in je training</h2>
      <p>
        De kritische snelheid verdeelt je tempo’s in twee werelden. Eronder
        bouwt vermoeidheid langzaam op en zijn tijd en brandstof de grens.
        Erboven gaat elke meter boven de lijn van D′ af, en als D′ op is,
        vertraag je, wat je motivatie ook zegt.
      </p>
      <ul>
        <li>
          Intervallen boven CS: 5 × 1000 m op 3:30 per km (4,76 m/s) voor de
          loper hierboven. Elke herhaling legt 1000 − 4,50 × 210 ≈ 55 m boven de
          kritische snelheid af, zo’n 38% van D′. De herstelpauzes vullen een
          deel weer aan, niet alles, en daarom voelen de laatste herhalingen
          zwaarder (Jones en Vanhatalo, 2017).
        </li>
        <li>
          Werk net onder CS: 3 × 10' op 3:48 tot 3:52 per km. Zwaar, maar de
          steady state houdt stand.
        </li>
        <li>
          Wedstrijdindeling: begin een 5 km sneller dan CS en je verbruikt D′ te
          vroeg. Verdeel het over de afstand en je finisht sneller.
        </li>
      </ul>
      <p>
        Smyth en Muniz-Pumares (2020) lieten zien dat de kritische snelheid kan
        worden geschat uit de ruwe trainingsdata van recreatieve marathonlopers,
        zonder aparte tests, en dat ze samenhangt met hun marathontijden. De
        statistieken van OpenAthlete doen hetzelfde in de weergave Capaciteiten:
        ze passen de lijn aan je beste inspanningen tussen 2 en 20 minuten
        (minstens drie), tonen het 95%-interval en doen hetzelfde met vermogen
        voor het kritisch vermogen op de fiets. Op de{' '}
        <Link href="/nl/features">functiepagina</Link> staat wat er verder uit
        je historie wordt berekend.
      </p>

      <h2>Beperkingen</h2>
      <p>
        Toptijden uit trainingen zijn geen maximale tests. Was je beste 3000 m
        een tempoloop, dan is de berekende snelheid lager dan je echte: de
        uitkomst is hoogstens wat je inspanningen laten zien. Inspanningen die
        rond dezelfde duur liggen geven een breed interval, en een GPS-toptijd
        bergaf of met rugwind trekt de lijn omhoog. Over lange afstanden zegt
        het model niets. De kritische snelheid is geen tempo dat je urenlang
        volhoudt, en een marathon loop je er ruim onder, op een niveau dat meer
        afhangt van uithoudingsvermogen en voeding dan van de lijn zelf.
        Combineer haar daarvoor met tools op basis van wedstrijdtijden, zoals de{' '}
        <Link href="/nl/tools/race-predictor">racetijdvoorspeller</Link> of de{' '}
        <Link href="/nl/pace-charts">tempotabellen</Link>, en bewaar de{' '}
        <Link href="/nl/learn/vma">VMA</Link> voor het korte eind van de curve.
      </p>
    </div>
  );
}

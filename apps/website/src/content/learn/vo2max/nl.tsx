import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        VO2max is de hoogste snelheid waarmee je zuurstof uit de lucht kunt
        opnemen en in je spieren kunt gebruiken. Het wordt gemeten in liters per
        minuut, of, voor lopers nuttiger, in milliliters per kilogram per
        minuut, omdat een zwaarder lichaam meer kost om te dragen. A. V. Hill
        beschreef het plateau van de zuurstofopname in de jaren twintig van de
        vorige eeuw, en sindsdien is VO2max het kopgetal van de
        inspanningsfysiologie van duursporten. Het bepaalt de grootte van je
        aerobe motor. Op zichzelf beslist het niet hoe snel je een wedstrijd
        loopt.
      </p>

      <h2>Wat de VO2max bepaalt: de vergelijking van Fick</h2>
      <p>
        Zuurstofopname is het product van hoeveel bloed het hart pompt en
        hoeveel zuurstof de spieren eruit halen:
      </p>
      <Formula
        where={[
          'Q = hartminuutvolume (liter bloed per minuut) = hartslag × slagvolume',
          'CaO2 − CvO2 = zuurstofgehalte van arterieel min veneus bloed (ml O2 per liter bloed)',
        ]}
      >
        VO2 = Q × (CaO2 − CvO2)
      </Formula>
      <p>
        Bij een maximale inspanning verschilt de zuurstofextractie tussen
        getrainde en ongetrainde mensen minder dan het hartminuutvolume, en de
        maximale hartslag stijgt niet door training. Wat een 40 van een 70
        scheidt, is vooral het slagvolume, de hoeveelheid bloed die bij elke
        slag wordt rondgepompt. Daarom concluderen Bassett en Howley (2000) dat
        de VO2max bij getrainde sporters vooral wordt beperkt door de
        zuurstoftoevoer, en niet door de spieren.
      </p>

      <h2>Hoe het wordt gemeten of geschat</h2>
      <p>
        De referentie is een labtest: een oplopende inspanning op een loopband
        met een masker dat je ademlucht analyseert, tot de zuurstofopname niet
        meer stijgt ondanks een hogere snelheid. Al het andere is een schatting:
      </p>
      <ul>
        <li>
          De Coopertest (Cooper, 1968): de afstand die je in 12 minuten loopt,
          daarna VO2max = (afstand in meter − 504,9) / 44,73.
        </li>
        <li>
          De hartslagverhouding (Uth et al., 2004): VO2max ≈ 15,3 × HSmax /
          HSrust. Snel, maar je hebt een echte maximale hartslag nodig en het
          negeert hoe snel je werkelijk loopt.
        </li>
        <li>
          Wedstrijdprestaties: de <Link href="/nl/learn/vdot">VDOT</Link> van
          Daniels maakt van een wedstrijdtijd een “effectieve” VO2max waarin je
          loopeconomie is meegenomen.
        </li>
        <li>
          Horloges: Garmin, Polar, COROS en anderen schatten het op basis van
          hartslag ten opzichte van tempo of vermogen tijdens het lopen, met
          modellen die ze niet volledig publiceren.
        </li>
      </ul>

      <h2>Een rekenvoorbeeld</h2>
      <p>
        Neem een loper die 2.900 m haalt in de Coopertest, een rusthartslag van
        48 en een maximale hartslag van 188 heeft, en onlangs een 10 km liep in
        45:00.
      </p>
      <ul>
        <li>Cooper: (2.900 − 504,9) / 44,73 = 53,5 ml/kg/min</li>
        <li>Hartslagverhouding: 15,3 × 188 / 48 = 59,9 ml/kg/min</li>
        <li>VDOT uit de 10 km: 45,3</li>
      </ul>
      <p>
        Drie getallen van 45 tot 60 voor dezelfde persoon. Geen ervan is fout;
        ze meten verschillende dingen. De verhoudingsmethode kijkt alleen naar
        het hart, de Coopertest naar een inspanning van 12 minuten, VDOT naar
        wat de loper werkelijk levert over 45 minuten. Zo’n verschil zegt
        meestal dat de loper een behoorlijke motor heeft en ruimte om
        loopeconomie en uithoudingsvermogen te verbeteren.
      </p>
      <p>
        Voor de labversie vul je aannemelijke waarden in: een hartminuutvolume
        van 25 liter per minuut en een extractie van 160 ml zuurstof per liter
        bloed geven 4.000 ml/min, of 57 ml/kg/min voor een loper van 70 kg.
      </p>

      <h2>VO2max, VMA en loopeconomie</h2>
      <p>
        Op vlak terrein kost hardlopen ongeveer 3,5 ml/kg/min zuurstof per km/u
        snelheid (Léger en Mercier, 1984). Deel de VO2max door die kosten en je
        krijgt bij benadering de{' '}
        <Link href="/nl/learn/vma">VMA (maximale aerobe snelheid)</Link>: 53,5 /
        3,5 ≈ 15,3 km/u, dicht bij de 15 km/u die deze loper uit een
        6-minutentest haalt. Een loper die minder zuurstof per km/u verbruikt,
        de zuinigere loper, haalt met dezelfde VO2max een hogere snelheid.
        Joyner en Coyle (2008) beschrijven duurprestatie als drie factoren die
        samenwerken: VO2max, het deel ervan dat je kunt volhouden (gekoppeld aan
        de lactaatdrempel) en loopeconomie.
      </p>

      <h2>Hoe je het in je training gebruikt</h2>
      <p>
        De VO2max reageert op werk dicht in de buurt ervan: 4 tot 6 herhalingen
        van 3 tot 5 minuten op 95 tot 100% van de VMA, met ongeveer even lange
        pauzes, of kortere vormen zoals 30/30. Hij stijgt ook met rustig volume,
        via een groter slagvolume. Om tempo’s te bepalen zijn VMA en VDOT
        praktischer, omdat het snelheden zijn. In OpenAthlete is VO2max een
        meetwaarde die je kunt importeren uit Garmin, Polar of COROS of met de
        hand kunt invoeren, en die je op de pagina met meetwaarden kunt volgen
        naast <Link href="/nl/learn/hrv">HRV</Link> en rusthartslag. De{' '}
        <Link href="/nl/tools/vma">VMA-calculator</Link> geeft je de tempo’s.
      </p>

      <h2>Beperkingen</h2>
      <p>
        Bij lopers van een vergelijkbaar niveau voorspelt de VO2max
        wedstrijdresultaten slecht: loopeconomie en het houdbare deel tellen net
        zo zwaar. Waarden van een horloge schuiven mee met hitte, heuvels,
        vermoeidheid en een verkeerde maximale hartslag, dus lees ze als een
        trend over weken. Genetica bepaalt een groot deel van het plafond, en de
        winst neemt af na de eerste trainingsjaren, terwijl drempel en
        loopeconomie nog lang kunnen blijven verbeteren.
      </p>
    </div>
  );
}

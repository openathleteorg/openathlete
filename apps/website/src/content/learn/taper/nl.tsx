import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        Taperen is de periode van lichtere training voor een doelwedstrijd. Het
        idee is oud en de logica eenvoudig: weken van hard trainen maken je
        tegelijk fitter en vermoeider, en vermoeidheid verdwijnt sneller dan
        fitheid. Verlaag de belasting een tijdje en de vermoeidheid ebt weg,
        terwijl het grootste deel van je fitheid blijft. Doe je het goed, dan
        sta je frisser aan de start dan je je in maanden hebt gevoeld. Doe je
        het fout, door te weinig te schrappen of te veel te rusten, dan kom je
        aan de start met nog vermoeide of juist wat lusteloze benen.
      </p>

      <h2>Wat het onderzoek zegt over taperen</h2>
      <p>
        Bosquet en collega’s (2007) bundelden 27 studies met wedstrijdsporters
        in hardlopen, wielrennen en zwemmen. Het patroon dat het best uitkwam
        was een taper van ongeveer twee weken, waarin het trainingsvolume
        geleidelijk met 41 tot 60% omlaag gaat, terwijl de intensiteit en het
        aantal trainingen per week gelijk blijven. Mujika en Padilla (2003)
        kwamen bij hun overzicht van de eerdere literatuur op een vergelijkbaar
        recept: houd de intensiteit vast, verlaag het volume flink, verlaag de
        frequentie met niet meer dan ongeveer 20%, en kies liever een
        geleidelijke afbouw dan een plotselinge val. Zij schatten de
        gebruikelijke prestatiewinst op ongeveer 3%, met een spreiding van 0,5
        tot 6%.
      </p>
      <p>
        Voor recreatieve marathonlopers bekeken Smyth en Lawlor (2021) de
        trainingslogboeken van meer dan 158.000 lopers. Strikte tapers, waarbij
        het volume week na week daalt, gingen samen met snellere eindtijden dan
        losse, en strikte tapers van drie weken deden het best, met een mediane
        winst van ongeveer vijfenhalve minuut (2,6%) ten opzichte van een
        minimale taper. Het gaat om observationele gegevens, dus misschien
        taperen fittere en gedisciplineerdere lopers gewoon beter, maar het
        wijst dezelfde kant op als de gecontroleerde studies.
      </p>

      <h2>Hoe een taper zichtbaar wordt in fitheid, vermoeidheid en vorm</h2>
      <p>
        Het <Link href="/nl/learn/ctl-atl-tsb">fitheid-vermoeidheidsmodel</Link>{' '}
        maakt het mechanisme zichtbaar. Fitheid (CTL) is een exponentieel
        gemiddelde van de dagelijkse belasting met een tijdconstante van 42
        dagen, vermoeidheid (ATL) een met een constante van 7 dagen, en vorm
        (TSB) is het verschil:
      </p>
      <Formula
        where={[
          'CTL-gewicht per dag = 1 − e^(−1/42) ≈ 0,024',
          'ATL-gewicht per dag = 1 − e^(−1/7) ≈ 0,133',
        ]}
      >
        CTL(vandaag) = CTL(gisteren) + (belasting − CTL(gisteren)) × 0,024
      </Formula>
      <p>
        Omdat ATL ongeveer vijfenhalf keer zo snel reageert als CTL, trekt een
        daling van de belasting de vermoeidheid veel sneller omlaag dan de
        fitheid, en stijgt de TSB. Dat is de hele taper in één regel.
      </p>

      <h2>Een rekenvoorbeeld</h2>
      <p>
        Een marathonloper heeft drie weken van ongeveer 560{' '}
        <Link href="/nl/learn/trimp">TRIMP</Link> per week achter de rug
        (ongeveer 80 km voor deze loper, of gemiddeld 80 per dag), na een basis
        van 65 per dag. Om het rekenwerk leesbaar te houden, is de belasting
        gelijk over elke week verdeeld.
      </p>
      <ul>
        <li>Begin van de taper: CTL 70,9, ATL 79,3, TSB −8,4.</li>
        <li>
          Twee weken voor de wedstrijd gaat het volume 30% omlaag (ongeveer 56
          km, 56 per dag). Aan het eind van die week: CTL 68,6, ATL 64,6, TSB
          +4,1.
        </li>
        <li>
          In de wedstrijdweek zakt het volume naar 45% van de piek (ongeveer 36
          per dag, zo’n 30 km voor de wedstrijddag). De dag voor de wedstrijd:
          CTL 64,3, ATL 48,1, TSB +16,2.
        </li>
      </ul>
      <p>
        In twee weken daalde de vermoeidheid met 31 punten en de fitheid met
        6,6, ongeveer 9%. Als dezelfde loper die 13 dagen helemaal was gestopt,
        was de CTL gezakt tot ongeveer 52. Het model is grof, maar het laat zien
        waarom een taper het volume verlaagt in plaats van te stoppen, en waarom
        het effect zich in de laatste dagen opbouwt.
      </p>

      <h2>Hoe je in de praktijk tapert</h2>
      <ul>
        <li>
          Marathon: twee tot drie weken. 10 km of halve marathon: een tot twee
          weken. Een B-wedstrijd: drie of vier lichtere dagen.
        </li>
        <li>
          Bouw het volume geleidelijk af: ongeveer 20 tot 30% in de eerste week
          van een taper van drie weken, 40 tot 60% in de wedstrijdweek. Kort
          eerst de lange duurloop in.
        </li>
        <li>
          Houd het ritme van de week en wat intensiteit vast. Een training als 3
          × 2 km op marathontempo tien dagen voor de wedstrijd, en dan 6 × 1 min
          iets sneller dan wedstrijdtempo vier dagen ervoor, houdt de benen
          gewend aan snelheid zonder extra vermoeidheid.
        </li>
        <li>
          Slaap, eet normaal, en bewaar nieuwe schoenen, nieuwe gels en nieuwe
          krachtoefeningen voor na de wedstrijd.
        </li>
      </ul>
      <p>
        In OpenAthlete kun je de weken markeren als een trainingscyclus met de
        fase Taper, en de{' '}
        <Link href="/nl/features/training-load">
          curves van de trainingsbelasting
        </Link>{' '}
        worden doorgetrokken over de trainingen die je hebt gepland. Zo zie je
        met welke vorm je op de wedstrijddag aan de start staat, nog voordat je
        één taper-training hebt gelopen.
      </p>

      <h2>Beperkingen</h2>
      <p>
        Er bestaat geen gevalideerde doel-TSB voor de wedstrijddag: het getal
        hangt af van hoe de belasting wordt gemeten en van de sporter, en de
        beste tapers in studies werden gevonden op basis van prestaties, niet
        van een curve. Een taper kan een te kort blok niet redden, en kan
        opgestapelde overbelasting niet in een week oplossen. Ook het gevoel
        tijdens een taper misleidt: zware benen en onrust komen vaak voor en
        zijn meestal verdwenen bij de start. Gebruik de curves om te plannen, en
        hoe de trainingen op wedstrijdtempo voelen om te oordelen.
      </p>
    </div>
  );
}

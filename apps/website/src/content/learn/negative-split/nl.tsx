import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        Een negatieve split betekent dat je de tweede helft van een wedstrijd
        sneller loopt dan de eerste. Het omgekeerde, een positieve split, is wat
        de meeste mensen lopen zonder het te willen: een start op adrenaline en
        een enthousiast publiek, en daarna een lang verval. Trainers raden de
        negatieve split al tientallen jaren aan, vooral als remedie tegen dat
        verval. Het bewijs is dunner dan het advies doet vermoeden, maar de
        gewoonte die het aanleert, je in het begin inhouden, is gezond voor
        alles vanaf de 10 km.
      </p>

      <h2>Hoe je een split meet</h2>
      <p>
        Knip de wedstrijd in twee gelijke afstanden en vergelijk de tijden. Druk
        je het verschil uit als percentage van de eerste helft, dan kun je een
        10 km vergelijken met een marathon:
      </p>
      <Formula
        where={[
          'T1 = tijd voor de eerste helft, T2 = tijd voor de tweede helft',
          'Negatieve waarde: negatieve split. Positieve waarde: positieve split. Binnen ongeveer ±1%: gelijkmatig tempo (even pacing)',
        ]}
      >
        split (%) = (T2 − T1) / T1 × 100
      </Formula>
      <p>
        De marge van ±1% voor “gelijkmatig” is een praktische afspraak, geen
        norm: gps-afwijkingen, wind en één heuvel kunnen een split al zoveel
        verschuiven. Op een heuvelachtig parcours of een parcours van A naar B
        vergelijk je stukken met een vergelijkbaar profiel, of kijk je naar het{' '}
        <Link href="/nl/learn/grade-adjusted-pace">
          voor helling gecorrigeerde tempo
        </Link>{' '}
        in plaats van naar de klok.
      </p>

      <h2>Een rekenvoorbeeld</h2>
      <p>
        Een loper mikt op 50:00 op de 10 km, gemiddeld 5:00/km. Ze passeert 5 km
        in 25:30 (5:06/km) en loopt de tweede 5 km in 24:30 (4:54/km).
      </p>
      <ul>
        <li>T2 − T1 = 1.470 − 1.530 = −60 s</li>
        <li>split = −60 / 1.530 × 100 = −3,9%</li>
      </ul>
      <p>
        Dat is een duidelijke negatieve split, en waarschijnlijk iets te
        duidelijk: wie de tweede helft van een 10 km een minuut sneller loopt,
        is meestal te voorzichtig begonnen en heeft onderweg tijd laten liggen.
      </p>
      <p>
        Op de marathon zijn de marges kleiner. Voor 3:30:00 (gemiddeld 4:59/km)
        is een verstandig plan 1:45:50 bij de helft (5:01/km) en daarna 1:44:10
        (4:56/km) voor de tweede helft: een split van −1,6%. De eerste helft
        maar twee à drie seconden per kilometer langzamer lopen dan het
        gemiddelde kost 50 seconden bij de helft, en koopt wat marge voor de
        laatste 10 km, waar de meeste marathons verloren gaan.
      </p>

      <h2>Hoe je het gebruikt</h2>
      <p>
        Het doel is niet om aan het eind te sprinten, maar om geen rente te
        betalen op een snelle start. De eerste kilometers boven je houdbare
        tempo lopen verbruikt koolhydraten en vermoeidheidstolerantie die je
        later in de wedstrijd niet meer terugwint. Een paar praktische regels:
      </p>
      <ul>
        <li>
          Baseer je streeftempo op een recente wedstrijd, niet op hoop. De{' '}
          <Link href="/nl/tools/race-predictor">wedstrijdtijdvoorspeller</Link>{' '}
          en de <Link href="/nl/pace-charts">tempotabellen</Link> geven
          tussentijden per kilometer voor een gekozen eindtijd.
        </li>
        <li>
          Plan op een halve of hele marathon de eerste 3 tot 5 km op 5 tot 10
          seconden per kilometer langzamer dan je streeftempo, en kom daarna op
          snelheid. Op een 10 km is het de eerste kilometer die je moet
          afremmen.
        </li>
        <li>
          Oefen het. Een progressieve duurloop, zoals 12 km die rustig begint en
          waarvan je de laatste 3 km op marathontempo loopt, leert je hoe
          inhouden voelt. Een lange duurloop van 26 km met de laatste 8 km op je
          beoogde marathontempo doet hetzelfde, met meer vermoeidheid.
        </li>
        <li>
          Beoordeel de wedstrijd achteraf op de split. Een positieve split van
          meer dan 3 à 4% op een marathon wijst bijna altijd naar de eerste
          helft, niet naar de tweede.
        </li>
      </ul>

      <h2>Beperkingen</h2>
      <p>
        Het onderzoek maakt van de negatieve split geen wet. In hun overzicht
        van pacingstrategieën vonden Abbiss en Laursen (2008) dat een
        gelijkmatig verdeeld tempo meestal het beste past bij inspanningen van
        meer dan een paar minuten, en dat getrainde atleten bij zeer lange
        wedstrijden doorgaans geleidelijk vertragen, wat hun voornemens ook
        zijn. Díaz en collega’s (2018) analyseerden alle wereldrecords op de
        marathon over vijftig jaar: gemiddeld liepen de recordhouders de eerste
        helft iets sneller dan de tweede. De recentste records waren het meest
        gelijkmatig, wat de auteurs deed vermoeden dat heel weinig
        snelheidsvariatie, eerder dan een uitgesproken negatieve split, de weg
        vooruit is.
      </p>
      <p>
        Het eerlijke doel voor de meeste lopers is dus een gelijkmatige split
        met een lichte neiging naar negatief, geen spectaculaire eindsprint. Ook
        het parcours speelt mee: een wedstrijd die in de tweede helft klimt,
        ziet er op de klok positief uit terwijl de inspanning perfect gelijk
        was. Bij trailrunning en ultra’s, waar terrein en nacht de tweede helft
        bepalen, zegt het vergelijken van helften op tijd weinig; inspanning,
        hartslag en voeding wegen zwaarder.
      </p>
    </div>
  );
}

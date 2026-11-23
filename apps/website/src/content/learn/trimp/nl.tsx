import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        TRIMP, kort voor training impulse (trainingsimpuls), maakt van een
        training één getal, op basis van twee dingen die je horloge toch al
        registreert: hoe lang je hebt getraind en hoe hoog je hartslag was. Eric
        Banister stelde het in de jaren zeventig voor als invoer voor zijn
        fitheid-vermoeidheidsmodel, en de meeste belastingsgrafieken op basis
        van hartslag draaien nog steeds op een of andere versie ervan. Het is
        eenvoudig genoeg om met de hand uit te rekenen, en dat is de beste
        manier om te zien wat het vangt en wat het mist.
      </p>

      <h2>Hoe TRIMP wordt berekend</h2>
      <p>
        Banisters TRIMP neemt het deel van je hartslagreserve dat je gebruikte,
        vermenigvuldigt het met de duur en past dan een exponentiële weging toe,
        zodat een minuut rond de drempel veel meer kost dan een minuut
        dribbelen:
      </p>
      <Formula
        where={[
          'HRr = (HS − HSrust) / (HSmax − HSrust), het gebruikte deel van de hartslagreserve',
          'y = 0,64 en k = 1,92 voor mannen; y = 0,86 en k = 1,67 voor vrouwen',
        ]}
      >
        TRIMP = minuten × HRr × y × e^(k × HRr)
      </Formula>
      <p>
        De weging is afgestemd op hoe het bloedlactaat stijgt met de hartslag:
        bijna vlak bij lage intensiteit, steil rond de drempel (Morton,
        Fitz-Clarke en Banister, 1990). De twee sets coëfficiënten zijn
        gemiddelden van de mannen en vrouwen in die studies. Niemand heeft
        aangetoond dat ze precies passen bij één individuele sporter, dus een
        TRIMP van 112 is niet echt nauwkeuriger dan 105.
      </p>
      <p>
        Je kunt de formule één keer toepassen op de gemiddelde hartslag van de
        hele training, of minuut voor minuut (seconde voor seconde met een
        opgenomen datastroom) en de stukjes optellen. De tweede manier is beter,
        om een reden die het voorbeeld hieronder concreet maakt.
      </p>

      <h2>Een rekenvoorbeeld</h2>
      <p>
        Een loper met een rusthartslag van 48 en een maximale hartslag van 188
        heeft een reserve van 140 slagen. Hij loopt 45 minuten met een
        gemiddelde van 150 bpm.
      </p>
      <ul>
        <li>HRr = (150 − 48) / 140 = 0,729</li>
        <li>Weging = 0,64 × e^(1,92 × 0,729) = 0,64 × 4,05 = 2,59</li>
        <li>TRIMP = 45 × 0,729 × 2,59 = 85</li>
      </ul>
      <p>
        Met de coëfficiënten voor vrouwen scoort dezelfde loop 95. Hetzelfde
        hart, dezelfde loop, 12% verschil door alleen de keuze van de
        coëfficiënten.
      </p>
      <p>
        Verdeel nu 20 minuten met hetzelfde gemiddelde anders: 10 minuten op 175
        bpm en 10 minuten op 125 bpm. Berekend op het gemiddelde (150 bpm
        gedurende 20 minuten) is de TRIMP 38. Blok voor blok berekend is het 33
        + 10 = 43, zo’n 15% meer. Omdat de weging exponentieel is, voegen de
        harde minuten meer toe dan de rustige eraf halen, en een gemiddelde
        strijkt precies het deel glad dat je vermoeit. Daarom worden
        intervaltrainingen onderschat als alleen de gemiddelde hartslag wordt
        gebruikt.
      </p>

      <h2>Hoe je TRIMP in je training gebruikt</h2>
      <p>
        De score van één training zegt weinig. TRIMP wordt nuttig als je het
        optelt: een weektotaal om blokken te vergelijken, en een dagelijkse
        reeks die de{' '}
        <Link href="/nl/learn/ctl-atl-tsb">
          curves voor fitheid, vermoeidheid en vorm
        </Link>{' '}
        (CTL, ATL, TSB) voedt. Een paar gewoonten helpen:
      </p>
      <ul>
        <li>
          Houd je rust- en maximale hartslag actueel. Een maximale hartslag die
          10 slagen te hoog staat, verkleint elke HRr en verlaagt elke score.
        </li>
        <li>
          Vergelijk jezelf met jezelf. Een weektotaal van 600 betekent in
          absolute zin niets; van 450 naar 650 gaan in twee weken wel.
        </li>
        <li>
          Lees TRIMP naast hoe de training voelde. Als een gewone rustige
          duurloop 20% hoger scoort dan normaal, zijn hitte, slecht slapen of
          een opkomende verkoudheid waarschijnlijkere verklaringen dan een
          plotselinge verandering in fitheid.
        </li>
      </ul>
      <p>
        OpenAthlete berekent Banisters TRIMP uit de hartslag per seconde van
        elke activiteit (uit het gemiddelde als er geen datastroom is), met de
        coëfficiënten hierboven, en toont{' '}
        <Link href="/nl/learn/session-rpe">session RPE</Link> ernaast. De{' '}
        <Link href="/nl/features/training-load">
          pagina over trainingsbelasting
        </Link>{' '}
        heeft een calculator en links naar de broncode.
      </p>

      <h2>Beperkingen</h2>
      <p>
        Hartslag is een interne maat, en die loopt achter. Bij sprints van 30
        seconden of korte heuvelsprints krijgt hij nauwelijks tijd om te
        stijgen, dus TRIMP onderschat anaeroob en neuromusculair werk.
        Krachttrainingen, bergaf lopen en de spierschade van een trailwedstrijd
        zijn nauwelijks zichtbaar. Hitte, uitdroging, cafeïne en hoogte drijven
        de hartslag op bij hetzelfde werk, en{' '}
        <Link href="/nl/learn/aerobic-decoupling">cardiac drift</Link> blaast de
        tweede helft van lange inspanningen op. Tot slot negeert de formule de
        sport: een uur op 140 bpm op de fiets en een uur op 140 bpm hardlopen
        scoren hetzelfde, hoewel de loop meestal meer schade achterlaat.
        Combineer TRIMP met een subjectieve score en behandel het als een trend,
        niet als een oordeel.
      </p>
    </div>
  );
}

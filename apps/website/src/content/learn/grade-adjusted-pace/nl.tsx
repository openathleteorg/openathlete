import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentNl() {
  return (
    <div>
      <p>
        Hellingsgecorrigeerd tempo (grade-adjusted pace, GAP) zet wat je op een
        helling liep om naar het tempo dat op vlak terrein evenveel energie zou
        hebben gekost. Een kilometer in 7:30 tegen een weg van 8% op ziet er op
        je horloge traag uit; gecorrigeerd voor de helling is hij net onder de
        5:00 op het vlakke waard. GAP bestaat omdat het ruwe tempo weinig meer
        zegt zodra de grond gaat hellen, en bij trailrunning is dat het grootste
        deel van de tijd.
      </p>
      <p>
        Er bestaan meerdere modellen. Het model dat hier en in OpenAthlete wordt
        gebruikt, komt van Alberto Minetti en collega’s, die de zuurstofkosten
        van hardlopen maten op een loopband tussen −45% en +45% en een curve
        door de resultaten trokken (Minetti et al., 2002).
      </p>

      <h2>Zo bereken je het hellingsgecorrigeerde tempo</h2>
      <p>
        De curve van Minetti geeft de energiekosten van één meter hardlopen bij
        een bepaalde helling, per kilo lichaamsgewicht. Op het vlakke is dat 3,6
        J/kg/m. GAP is de verhouding tussen de kosten op het vlakke en de kosten
        op de helling, toegepast op je tempo:
      </p>
      <Formula
        where={[
          'C(i) = 155,4i⁵ − 30,4i⁴ − 43,3i³ + 46,3i² + 19,5i + 3,6, in J/kg/m',
          'i = helling als fractie: 0,08 voor 8%, −0,10 voor −10%',
          'C(0) = 3,6 op het vlakke',
        ]}
      >
        GAP = tempo op de helling × 3,6 / C(i)
      </Formula>
      <p>
        Dezelfde verhouding werkt ook andersom: het tempo dat je op een helling
        moet aanhouden voor een bepaalde vlakke inspanning is{' '}
        <code>vlak tempo × C(i) / 3,6</code>. Over een hele activiteit wordt de
        berekening punt voor punt op de geregistreerde hoogte gedaan en daarna
        gemiddeld, zodat een heuvelachtige loop één GAP-waarde krijgt naast zijn
        ruwe gemiddelde tempo.
      </p>

      <h2>Een rekenvoorbeeld</h2>
      <ul>
        <li>
          Bergop: 7:30/km op een klim van 8%. C(0,08) = 5,43, dat is 1,51 keer
          de kosten op het vlakke. 7:30 (450 s) / 1,51 = 298 s, dus ongeveer
          4:58/km op het vlakke.
        </li>
        <li>
          Andersom: een loper met een rustig vlak tempo van 5:30/km wil dezelfde
          inspanning op een klim van 6%. C(0,06) = 4,93, 1,37 keer de vlakke
          kosten, dus 5:30 × 1,37 = 7:32/km. Bij 15% is de verhouding 2,06 en
          wordt het tempo 11:20/km. Dan gaan de meeste mensen wandelen, en dat
          is de juiste keuze.
        </li>
        <li>
          Bergaf: 4:30/km bij −10%. C(−0,10) = 2,15, maar 0,6 keer de vlakke
          kosten, dus het vlakke equivalent is 7:32/km. De energierekening is
          klein; de rekening voor je bovenbeenspieren niet.
        </li>
      </ul>
      <p>
        De{' '}
        <Link href="/nl/tools/grade-adjusted-pace">
          calculator voor hellingsgecorrigeerd tempo
        </Link>{' '}
        rekent dit uit voor elk tempo en elke helling.
      </p>

      <h2>Zo gebruik je het in je training</h2>
      <p>
        GAP is het nuttigst om loopjes op verschillend terrein te vergelijken.
        Een rondje van 14 km met 500 hoogtemeters in gemiddeld 6:10/km en een
        vlakke 14 km in 5:20/km kunnen voor je hart dezelfde training zijn
        geweest. Als je GAP naast je hartslag legt, zie je of een trage dag aan
        de heuvels lag of aan jou.
      </p>
      <p>
        Het helpt ook om doelen te stellen op heuvelachtige routes. Moeten je
        rustige duurlopen op een inspanning van 5:30 op het vlakke blijven, dan
        is een heuvel van 6% in 7:30 prima en dezelfde heuvel in 6:30 een
        vermomde tempoloop. Bij heuveltrainingen zoals 8 × 2' bergop laat GAP
        zien of de laatste herhaling evenveel waard was als de eerste, ook als
        het tempo op je horloge wegzakte.
      </p>
      <p>
        Gebruik het op wedstrijddag met beleid. GAP vertelt wat een klim aan
        energie kost, niet hoe lang een bergwedstrijd duurt; daarvoor zitten{' '}
        <Link href="/nl/learn/km-effort">km-effort</Link> en de{' '}
        <Link href="/nl/tools/trail-time-estimator">trailtijdcalculator</Link>{' '}
        dichter bij de vraag.
      </p>
      <p>
        OpenAthlete past de curve van Minetti toe op elke hardloop- en trailrun
        die je synchroniseert. De helling wordt afgelezen uit de hoogte over
        vensters van 10 m en begrensd op ±30%, omdat steilere waarden meestal
        ruis van gps of barometer zijn en geen terrein.
      </p>

      <h2>Beperkingen</h2>
      <p>
        De proefpersonen van Minetti liepen op een gladde loopband. Stenen,
        wortels, modder en haarspeldbochten voegen kosten toe die de curve niet
        kent, dus op technisch terrein was je echte inspanning hoger dan GAP
        laat zien.
      </p>
      <p>
        Afdalingen zijn het zwakste punt. Op papier blijven de kosten dalen tot
        een minimum rond −18 tot −20%, waar een meter half zoveel kost als op
        het vlakke. In de praktijk word je voorbij ongeveer −10% beperkt door
        remmen, voetplaatsing en de excentrische belasting op je quadriceps,
        lang voordat de energie opraakt. Een snelle afdaling toont een mild GAP,
        maar kan precies zijn waardoor je drie dagen spierpijn hebt.
      </p>
      <p>
        Hoogtedata bevatten ruis. Een horloge met barometer doet het beter dan
        gps-hoogte, maar allebei maken ze op vlak terrein kleine nepklimmetjes
        die GAP iets verschuiven. Korte, steile stukken zoals een helling van 20
        m worden door het middelingsvenster gladgestreken.
      </p>
      <p>
        Tot slot gebruiken andere platforms andere modellen. Strava zegt dat
        zijn GAP is gebouwd op hartslagdata van zijn gebruikers in plaats van op
        labmetingen, en het geeft minder krediet in afdalingen. De getallen
        verschillen per tool; vergelijk loopjes binnen één tool, niet tussen
        tools.
      </p>
    </div>
  );
}

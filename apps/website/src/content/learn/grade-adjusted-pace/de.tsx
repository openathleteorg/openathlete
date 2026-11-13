import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Die steigungsbereinigte Pace, kurz GAP (Grade-adjusted Pace), rechnet
        das, was du am Hang gelaufen bist, in die Pace um, die auf flachem
        Gelände dieselbe Energie gekostet hätte. Ein Kilometer in 7:30 bei 8 %
        Steigung auf der Straße sieht auf der Uhr langsam aus,
        steigungsbereinigt ist er knapp unter 5:00 im Flachen wert. GAP gibt es,
        weil die reine Pace kaum noch etwas aussagt, sobald das Gelände kippt,
        und beim Trailrunning ist das fast immer der Fall.
      </p>
      <p>
        Es gibt mehrere Modelle. Das hier und in OpenAthlete verwendete stammt
        von Alberto Minetti und Kollegen, die den Sauerstoffverbrauch beim
        Laufen auf einem Laufband mit Neigungen zwischen −45 % und +45 %
        gemessen und eine Kurve an die Ergebnisse angepasst haben (Minetti et
        al., 2002).
      </p>

      <h2>So wird die steigungsbereinigte Pace berechnet</h2>
      <p>
        Minettis Kurve gibt die Energiekosten an, um bei einer bestimmten
        Steigung einen Meter zu laufen, pro Kilogramm Körpergewicht. Im Flachen
        sind es 3,6 J/kg/m. GAP ist das Verhältnis zwischen den Kosten im
        Flachen und den Kosten am Hang, angewendet auf deine Pace:
      </p>
      <Formula
        where={[
          'C(i) = 155,4i⁵ − 30,4i⁴ − 43,3i³ + 46,3i² + 19,5i + 3,6, in J/kg/m',
          'i = Steigung als Bruch: 0,08 für 8 %, −0,10 für −10 %',
          'C(0) = 3,6 im Flachen',
        ]}
      >
        GAP = Pace am Hang × 3,6 / C(i)
      </Formula>
      <p>
        Dasselbe Verhältnis funktioniert auch andersherum: Die Pace, die du am
        Hang für eine bestimmte Anstrengung im Flachen halten solltest, ist{' '}
        <code>Pace im Flachen × C(i) / 3,6</code>. Über eine ganze Aktivität
        wird die Berechnung Punkt für Punkt anhand der aufgezeichneten Höhe
        durchgeführt und dann gemittelt, sodass ein hügeliger Lauf neben seiner
        reinen Durchschnittspace einen GAP-Wert bekommt.
      </p>

      <h2>Ein Rechenbeispiel</h2>
      <ul>
        <li>
          Bergauf: 7:30/km bei 8 % Steigung. C(0,08) = 5,43, also das 1,51-Fache
          der Kosten im Flachen. 7:30 (450 s) / 1,51 = 298 s, also etwa 4:58/km
          im Flachen.
        </li>
        <li>
          Umgekehrt: Ein Läufer, dessen lockere Pace im Flachen 5:30/km beträgt,
          will dieselbe Anstrengung an einem Anstieg mit 6 %. C(0,06) = 4,93,
          das 1,37-Fache der Kosten im Flachen, also 5:30 × 1,37 = 7:32/km. Bei
          15 % liegt das Verhältnis bei 2,06, und die Pace wird zu 11:20/km.
          Spätestens dann gehen die meisten, und Gehen ist die richtige
          Entscheidung.
        </li>
        <li>
          Bergab: 4:30/km bei −10 %. C(−0,10) = 2,15, nur das 0,6-Fache der
          Kosten im Flachen, das Äquivalent im Flachen ist also 7:32/km. Die
          Energierechnung ist klein, die Rechnung für deine Oberschenkel nicht.
        </li>
      </ul>
      <p>
        Der{' '}
        <Link href="/de/tools/grade-adjusted-pace">
          Rechner für steigungsbereinigte Pace
        </Link>{' '}
        berechnet diese Werte für jede Pace und jede Steigung.
      </p>

      <h2>So nutzt du sie im Training</h2>
      <p>
        Am nützlichsten ist GAP, um Läufe auf unterschiedlichem Gelände zu
        vergleichen. Eine 14-km-Runde mit 500 Hm in durchschnittlich 6:10/km und
        flache 14 km in 5:20/km können für dein Herz dieselbe Einheit gewesen
        sein. Wenn du GAP und Herzfrequenz nebeneinander betrachtest, siehst du,
        ob ein langsamer Tag an den Hügeln lag oder an dir.
      </p>
      <p>
        Außerdem hilft sie dir, auf hügeligen Strecken Zielvorgaben zu setzen.
        Wenn deine lockeren Läufe bei einer Anstrengung von 5:30 im Flachen
        bleiben sollen, ist ein 6-%-Anstieg in 7:30 in Ordnung, ein 6-%-Anstieg
        in 6:30 dagegen ein getarnter Tempodauerlauf. Bei Bergintervallen wie 8
        × 2&apos; bergauf kannst du mit GAP prüfen, ob die letzte Wiederholung
        so viel wert war wie die erste, auch wenn die Pace auf der Uhr
        abgedriftet ist.
      </p>
      <p>
        Am Wettkampftag solltest du sie mit Vorsicht nutzen. GAP sagt dir, was
        ein Anstieg an Energie kostet, nicht, wie lange ein Berglauf dauern
        wird. Dafür sind <Link href="/de/learn/km-effort">Km-Effort</Link> und
        der{' '}
        <Link href="/de/tools/trail-time-estimator">
          Zeitrechner für Trailläufe
        </Link>{' '}
        näher an der Frage.
      </p>
      <p>
        OpenAthlete wendet Minettis Kurve auf jeden Lauf und jeden Traillauf an,
        den du synchronisierst. Die Steigung wird aus der Höhe über Fenster von
        10 m gelesen und auf ±30 % begrenzt, weil steilere Werte meist GPS- oder
        Barometerrauschen sind und nicht das Gelände.
      </p>

      <h2>Grenzen</h2>
      <p>
        Minettis Probanden liefen auf einem glatten Laufband. Steine, Wurzeln,
        Matsch und Serpentinen erhöhen die Kosten auf eine Weise, die die Kurve
        nicht kennt. Auf technischem Gelände war deine tatsächliche Anstrengung
        also höher, als GAP anzeigt.
      </p>
      <p>
        Bergab ist der schwächste Teil. Auf dem Papier sinken die Kosten bis zu
        einem Minimum bei etwa −18 bis −20 %, wo ein Meter halb so viel kostet
        wie im Flachen. In der Praxis begrenzen dich ab etwa −10 % das Bremsen,
        der Tritt und die exzentrische Belastung der Oberschenkelmuskulatur,
        lange bevor die Energie knapp wird. Ein schneller Downhill zeigt einen
        harmlosen GAP, kann aber genau das sein, was dir drei Tage Muskelkater
        beschert.
      </p>
      <p>
        Höhendaten sind verrauscht. Eine Uhr mit Barometer ist besser als die
        GPS-Höhe, aber beide erzeugen im Flachen kleine Scheinanstiege, die den
        GAP leicht verschieben. Kurze, steile Abschnitte wie eine 20-m-Rampe
        werden durch das Mittelungsfenster geglättet.
      </p>
      <p>
        Und schließlich nutzen andere Plattformen andere Modelle. Strava gibt
        an, seine GAP aus den Herzfrequenzdaten seiner Athleten statt aus
        Labormessungen entwickelt zu haben, und rechnet Abstiege weniger stark
        an. Die Werte unterscheiden sich zwischen Tools: Vergleiche Läufe
        innerhalb eines Tools, nicht über Tools hinweg.
      </p>
    </div>
  );
}

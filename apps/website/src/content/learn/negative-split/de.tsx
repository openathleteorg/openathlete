import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Ein Negative Split bedeutet, die zweite Hälfte eines Rennens schneller
        zu laufen als die erste. Das Gegenteil, ein Positive Split, ist das, was
        die meisten unbeabsichtigt laufen: ein Start, getragen von Adrenalin und
        jubelnden Zuschauern, dann ein langes Einbrechen. Coaches empfehlen den
        Negative Split seit Jahrzehnten, vor allem als Mittel gegen dieses
        Einbrechen. Die Studienlage dahinter ist dünner, als der Rat vermuten
        lässt, aber die Gewohnheit, die er schult, sich am Anfang
        zurückzuhalten, ist für alles ab 10 km sinnvoll.
      </p>

      <h2>Wie ein Split gemessen wird</h2>
      <p>
        Teile das Rennen in zwei gleich lange Abschnitte und vergleiche die
        Zeiten. Drückst du die Differenz als Prozentsatz der ersten Hälfte aus,
        kannst du einen 10-km-Lauf mit einem Marathon vergleichen:
      </p>
      <Formula
        where={[
          'T1 = Zeit für die erste Hälfte, T2 = Zeit für die zweite Hälfte',
          'Negativer Wert: Negative Split. Positiver Wert: Positive Split. Innerhalb von etwa ±1\u00a0%: gleichmäßiges Tempo (Even Pacing)',
        ]}
      >
        Split (%) = (T2 − T1) / T1 × 100
      </Formula>
      <p>
        Der Bereich von ±1&nbsp;% für „gleichmäßig“ ist eine praktische
        Konvention, kein Standard: GPS-Abweichungen, Wind und ein einzelner
        Hügel können einen Split allein schon um so viel verschieben. Auf einer
        hügeligen Strecke oder einer Strecke von A nach B vergleichst du besser
        Hälften mit ähnlichem Profil oder schaust auf die{' '}
        <Link href="/de/learn/grade-adjusted-pace">
          steigungsbereinigte Pace
        </Link>{' '}
        statt auf die Uhr.
      </p>

      <h2>Ein Rechenbeispiel</h2>
      <p>
        Eine Läuferin peilt 50:00 über 10 km an, also im Schnitt 5:00/km. Sie
        passiert km 5 nach 25:30 (5:06/km) und läuft die zweiten 5 km in 24:30
        (4:54/km).
      </p>
      <ul>
        <li>T2 − T1 = 1.470 − 1.530 = −60 s</li>
        <li>Split = −60 / 1.530 × 100 = −3,9&nbsp;%</li>
      </ul>
      <p>
        Das ist ein klarer Negative Split, und wahrscheinlich ein etwas zu
        klarer: Wer die zweite Hälfte eines 10-km-Laufs eine Minute schneller
        läuft, war in der ersten Hälfte meist zu vorsichtig und hat Zeit auf der
        Strecke liegen lassen.
      </p>
      <p>
        Beim Marathon sind die Spielräume kleiner. Für 3:30:00 (im Schnitt
        4:59/km) ist ein sinnvoller Plan 1:45:50 zur Halbzeit (5:01/km) und dann
        1:44:10 (4:56/km) für die zweite Hälfte: ein Split von −1,6&nbsp;%. Die
        erste Hälfte nur zwei oder drei Sekunden pro Kilometer langsamer als den
        Schnitt zu laufen, kostet zur Halbzeit 50 Sekunden und verschafft dir
        Reserven für die letzten 10 km, auf denen die meisten Marathons verloren
        werden.
      </p>

      <h2>So setzt du es um</h2>
      <p>
        Es geht nicht darum, am Ende zu sprinten, sondern darum, keine Zinsen
        für einen zu schnellen Start zu zahlen. Wer die ersten Kilometer über
        seinem durchhaltbaren Tempo läuft, verbraucht Kohlenhydrate und
        Ermüdungstoleranz, die im weiteren Rennverlauf nicht zurückkommen. Ein
        paar praktische Regeln:
      </p>
      <ul>
        <li>
          Leg deine Zielpace anhand eines aktuellen Wettkampfs fest, nicht
          anhand einer Hoffnung. Der{' '}
          <Link href="/de/tools/race-predictor">Wettkampfzeit-Rechner</Link> und
          die <Link href="/de/pace-charts">Pace-Tabellen</Link> liefern
          Kilometerzeiten für eine bestimmte Zielzeit.
        </li>
        <li>
          Plane im Halbmarathon oder Marathon die ersten 3 bis 5 km 5 bis 10
          Sekunden pro Kilometer langsamer als die Zielpace ein und finde dann
          dein Tempo. Im 10-km-Lauf ist es der erste Kilometer, bei dem du dich
          bremsen musst.
        </li>
        <li>
          Übe es. Ein Steigerungslauf, etwa 12 km, die locker beginnen und auf
          den letzten 3 km im Marathontempo enden, lehrt dich, wie sich
          Zurückhaltung anfühlt. Ein langer Lauf über 26 km mit den letzten 8 km
          im Marathon-Zieltempo macht dasselbe mit mehr Ermüdung.
        </li>
        <li>
          Beurteile das Rennen hinterher anhand des Splits. Ein Positive Split
          von mehr als 3 oder 4&nbsp;% im Marathon deutet fast immer auf die
          erste Hälfte hin, nicht auf die zweite.
        </li>
      </ul>

      <h2>Grenzen</h2>
      <p>
        Die Forschung macht den Negative Split nicht zum Gesetz. In ihrer
        Übersichtsarbeit zu Pacing-Strategien fanden Abbiss und Laursen (2008),
        dass ein gleichmäßig verteiltes Tempo eher zu Wettkämpfen passt, die
        länger als ein paar Minuten dauern, und dass trainierte Athleten bei
        sehr langen Wettkämpfen meist nach und nach langsamer werden, ganz
        gleich, was sie vorhatten. Díaz und Kollegen (2018) analysierten alle
        Marathon-Weltrekorde aus fünfzig Jahren: Im Schnitt liefen die
        Rekordhalter die erste Hälfte etwas schneller als die zweite. Die
        jüngeren Rekorde waren die gleichmäßigsten, weshalb die Autoren
        vermuten, dass sehr geringe Temposchwankungen statt eines ausgeprägten
        Negative Splits der Weg nach vorn sein könnten.
      </p>
      <p>
        Das ehrliche Ziel für die meisten Läufer ist daher ein gleichmäßiger
        Split mit leichter Tendenz nach negativ, kein spektakulärer Endspurt.
        Auch die Strecke spielt mit: Ein Rennen, das in der zweiten Hälfte
        ansteigt, sieht auf der Uhr positiv aus, obwohl die Anstrengung
        vollkommen gleichmäßig war. Im Trailrunning und bei Ultras, wo Gelände
        und Nacht die zweite Hälfte bestimmen, sagt der Zeitvergleich der
        Hälften wenig aus; Anstrengung, Herzfrequenz und Verpflegung zählen
        mehr.
      </p>
    </div>
  );
}

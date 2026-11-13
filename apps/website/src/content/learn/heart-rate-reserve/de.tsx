import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Die Herzfrequenzreserve ist der Bereich, mit dem dein Herz tatsächlich
        arbeiten kann: deine maximale Herzfrequenz minus deinen Ruhepuls. Ein
        Läufer mit einem Ruhepuls von 50 und einer HFmax von 190 hat 140 Schläge
        Reserve. Trainingszonen, die auf diesem Bereich statt auf einem
        einfachen Prozentsatz der HFmax beruhen, meinen die meisten, wenn sie
        von der Karvonen-Methode sprechen. Benannt ist sie nach dem finnischen
        Physiologen Martti Karvonen, der sie 1957 in einer Studie darüber
        nutzte, wie Training die Herzfrequenz senkt.
      </p>
      <p>
        Der Reiz der Methode: Sie berücksichtigt deinen Ausgangspunkt. Zwei
        Läufer mit derselben HFmax, aber unterschiedlichem Ruhepuls haben nicht
        dieselbe lockere Pace in Schlägen pro Minute, und die Reserve erkennt
        das. Außerdem passt sie besser zur Physiologie als Prozentwerte der
        HFmax: Swain und Leutholtz (1997) zeigten, dass ein bestimmter
        Prozentsatz der Herzfrequenzreserve demselben Prozentsatz der
        Sauerstoffaufnahmereserve entspricht, während ein Prozentsatz der HFmax
        nicht demselben Prozentsatz der VO2max entspricht.
      </p>

      <h2>So wird sie berechnet</h2>
      <Formula
        where={[
          'HFR = HFmax − HFRuhe, in Schlägen pro Minute',
          'Intensität = der gewünschte Anteil der Reserve, 0,6 für 60 %',
        ]}
      >
        Ziel-HF = HFRuhe + (HFmax − HFRuhe) × Intensität
      </Formula>
      <p>
        Die üblichen fünf Zonen sind Bänder von 10 % der Reserve: 50–60 %, 60–70
        %, 70–80 %, 80–90 % und 90–100 %. Die Prozentwerte sind Konventionen,
        keine an dir gemessenen Schwellen, und das spielt später eine Rolle.
      </p>

      <h2>Ein Rechenbeispiel</h2>
      <p>Ruhepuls 50 bpm, HFmax 190 bpm, also eine Reserve von 140 Schlägen.</p>
      <ul>
        <li>Zone 1 (50–60 %): 50 + 0,5 × 140 = 120 bis 134 bpm</li>
        <li>Zone 2 (60–70 %): 134 bis 50 + 0,7 × 140 = 148 bpm</li>
        <li>Zone 3 (70–80 %): 148 bis 162 bpm</li>
        <li>Zone 4 (80–90 %): 162 bis 176 bpm</li>
        <li>Zone 5 (90–100 %): 176 bis 190 bpm</li>
      </ul>
      <p>
        Mit Prozentwerten der HFmax läge dieselbe Zone 2 bei 114 bis 133 bpm,
        gut 15 Schläge tiefer. Für einen trainierten Läufer ist 114 bpm kaum
        mehr als Traben. Deshalb stellen viele, die zu Karvonen wechseln, fest,
        dass sich ihre lockeren Läufe nicht mehr wie Gehen anfühlen.
      </p>
      <p>
        Lass die HFmax nun bei 190, aber heb den Ruhepuls auf 65. Die Reserve
        sinkt auf 125 Schläge, und Zone 2 wird zu 65 + 0,6 × 125 = 140 bis 65 +
        0,7 × 125 = 152,5, also etwa 140 bis 153 bpm. Dieselbe HFmax, eine
        andere Zone, weil sich der Ausgangspunkt verschoben hat.
      </p>

      <h2>Die beiden Werte richtig bestimmen</h2>
      <p>
        Den Ruhepuls misst du am besten liegend direkt nach dem Aufwachen, vor
        dem Kaffee, über mehrere Morgen. Nimm einen typischen Wert, nicht den
        niedrigsten, den du je gesehen hast. Uhren melden oft das Minimum
        während des Schlafs, das ein paar Schläge tiefer liegen kann und die
        Reserve leicht aufbläht.
      </p>
      <p>
        Die maximale Herzfrequenz ist der schwierigere Wert. Der höchste Wert,
        den du am Ende eines harten Wettkampfs oder nach der letzten von
        mehreren harten Bergwiederholungen gesehen hast, ist mehr wert als jede
        Formel. Wenn du nichts hast, liefern Tanaka, Monahan und Seals (2001)
        208 − 0,7 × Alter, also 180 bpm mit 40. Das ist ein
        Bevölkerungsdurchschnitt: Viele liegen 10 Schläge oder mehr darüber oder
        darunter, und eine um 10 Schläge zu hohe HFmax verschiebt jede Zone um
        etwa 6 bis 9 Schläge nach oben.
      </p>

      <h2>So nutzt du sie im Training</h2>
      <p>
        Herzfrequenzzonen funktionieren am besten bei langen, gleichmäßigen
        Belastungen, bei denen sich das Herz einpendeln kann. Lockere und lange
        Läufe in <Link href="/de/learn/zone-2">Zone 2</Link> sind der
        offensichtliche Fall: für den Läufer oben 134 bis 148 bpm, egal welche
        Pace an einem hügeligen oder windigen Tag dabei herauskommt. Auch
        Tempodauerläufe von 30 bis 40 Minuten in Zone 3 oder 2 × 15 Minuten nahe
        der Obergrenze von Zone 4 (etwa 169 bis 173 bpm, 85–88 % der Reserve)
        lassen sich gut nach Herzfrequenz steuern.
      </p>
      <p>
        Bei kurzen Intervallen wie 5 × 4 Minuten an der Schwelle hinkt die
        Herzfrequenz der Anstrengung hinterher: Sie braucht ein bis zwei
        Minuten, um zu steigen, und die erste Wiederholung sieht auf der Uhr
        leicht aus, obwohl sie es nicht ist. Steuere solche Einheiten nach Pace
        oder Leistung und nutze die Herzfrequenz hinterher, um zu prüfen, ob die
        Einheit das bewirkt hat, was du wolltest. Derselbe Reserveanteil fließt
        auch in Belastungswerte wie <Link href="/de/learn/trimp">TRIMP</Link>{' '}
        ein, korrekte Werte für Ruhepuls und HFmax zahlen sich also doppelt aus.
      </p>
      <p>
        Der{' '}
        <Link href="/de/tools/heart-rate-zones">
          Rechner für Herzfrequenzzonen
        </Link>{' '}
        übernimmt die Rechnung für beide Methoden. In OpenAthlete lassen sich
        Herzfrequenzzonen als Prozentsatz der HFmax oder der Reserve festlegen,
        die Reserve wird aus deinen Messwerten für Ruhepuls und HFmax berechnet,
        und Workout-Schritte können einen Prozentsatz der Herzfrequenzreserve
        als Ziel haben.
      </p>

      <h2>Grenzen</h2>
      <p>
        Alles beruht auf zwei Eingaben, und beide sind verrauscht. Der Ruhepuls
        schwankt um mehrere Schläge mit Schlaf, Stress, Hitze oder einer
        aufkommenden Erkältung. Die Herzfrequenz unter Belastung steigt mit
        Hitze, Dehydrierung, Koffein und Höhe und driftet bei langen Belastungen
        nach oben. Manche Medikamente, insbesondere Betablocker, verändern beide
        Enden des Bereichs.
      </p>
      <p>
        Die größere Grenze ist, dass 60 %, 70 % oder 80 % der Reserve für alle
        gleich sind, die Physiologie aber nicht. Bei einem Läufer liegt die{' '}
        <Link href="/de/learn/lactate-threshold">Laktatschwelle</Link> bei 82 %
        der Reserve, bei einem anderen bei 90 %. Wenn du deine
        Schwellenherzfrequenz aus einem Labortest oder einer 30-minütigen
        Wettkampfbelastung kennst, sind Zonen, die darauf beruhen, genauer. Wenn
        nicht, ist Karvonen ein solider Standard.
      </p>
    </div>
  );
}

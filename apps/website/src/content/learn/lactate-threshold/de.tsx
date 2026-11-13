import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Deine Muskeln produzieren bei jedem Tempo Laktat, sogar beim Gehen, und
        bauen es ebenso stetig wieder ab. Bei lockerem Tempo halten sich beide
        die Waage, und die Konzentration im Blut bleibt nahe am Ruhewert, um 1
        mmol/l. Wirst du schneller, übersteigt die Produktion irgendwann den
        Abbau. Diesen Punkt meint man mit Laktatschwelle, und er ist der Grund,
        warum sich ein Tempo, das du eine Stunde halten kannst, so anders
        anfühlt als eines, das nur 15 Sekunden pro Kilometer schneller ist.
      </p>
      <p>
        Das Problem: „Die“ Laktatschwelle gibt es nicht als einen allgemein
        anerkannten Wert. Faude, Kindermann und Meyer (2009) haben mehr als
        zwanzig Schwellenkonzepte aus der Literatur ausgewertet, die auf
        unterschiedlichen Protokollen und unterschiedlichen Regeln zum Ablesen
        derselben Kurve beruhen. In der Praxis lassen sie sich zwei Familien
        zuordnen. Die erste Schwelle (LT1, oft aerobe Schwelle genannt) ist der
        Punkt, an dem das Laktat erstmals über den Ruhewert steigt. Die zweite
        (LT2, die anaerobe Schwelle oder in ihrer strengsten Form der maximale
        Laktat-Steady-State, maxLass) ist die höchste Intensität, bei der sich
        das Laktat noch auf einem stabilen Wert einpendelt, statt zu steigen,
        bis du aufhörst. Wenn ein Coach von „Schwellenlauf“ spricht, meint er
        fast immer LT2.
      </p>

      <h2>So wird sie gemessen</h2>
      <p>
        Der klassische Test ist ein Stufentest auf dem Laufband oder der Bahn:
        Stufen von 3 bis 5 Minuten, jede 0,5 bis 1 km/h schneller als die
        vorherige, mit einem Tropfen Blut aus Fingerkuppe oder Ohrläppchen am
        Ende jeder Stufe. Anschließend liest man die Schwelle an der Kurve ab.
        Zwei Regeln sind verbreitet: eine feste Konzentration, meist 4 mmol/l
        für LT2, und ein Anstieg über den Ausgangswert, oft Ausgangswert + 1
        mmol/l für LT1. Die Geschwindigkeit zwischen zwei Stufen wird linear
        interpoliert:
      </p>
      <Formula
        where={[
          'La = Ziel-Laktatwert (4 mmol/l oder Ausgangswert + 1)',
          'v1, La1 = Geschwindigkeit und Laktat der letzten Stufe unter dem Zielwert',
          'v2, La2 = Geschwindigkeit und Laktat der ersten Stufe darüber',
        ]}
      >
        v = v1 + (La − La1) / (La2 − La1) × (v2 − v1)
      </Formula>
      <p>
        Der maximale Laktat-Steady-State ist die Referenz, der sich die anderen
        Methoden anzunähern versuchen, aber um ihn zu bestimmen, braucht es
        mehrere Tage mit 30-minütigen Läufen in konstantem Tempo. Deshalb misst
        ihn außerhalb von Laboren kaum jemand (Jones et al., 2019).
      </p>

      <h2>Ein Rechenbeispiel</h2>
      <p>
        Ein Läufer absolviert 4-Minuten-Stufen ab 10 km/h und steigert jedes Mal
        um 1 km/h. Laktat am Ende jeder Stufe: 1,1, 1,2, 1,4, 1,8, 2,6, 4,1 und
        6,3 mmol/l bei 10, 11, 12, 13, 14, 15 und 16 km/h.
      </p>
      <ul>
        <li>
          LT2 bei 4 mmol/l: zwischen 14 km/h (2,6) und 15 km/h (4,1). v = 14 +
          (4 − 2,6) / (4,1 − 2,6) × 1 = 14,9 km/h, also 4:01 pro km.
        </li>
        <li>
          LT1 bei Ausgangswert + 1: Der niedrigste Wert ist 1,1, der Zielwert
          also 2,1 mmol/l, zwischen 13 km/h (1,8) und 14 km/h (2,6). v = 13 +
          0,3 / 0,8 = 13,4 km/h, also 4:29 pro km.
        </li>
      </ul>
      <p>
        Derselbe Test, dasselbe Blut, und die beiden Schwellen liegen fast 30
        Sekunden pro Kilometer auseinander. Liest du die Kurve mit einer anderen
        Regel ab (zum Beispiel dem Punkt mit dem größten Abstand zu einer Linie
        zwischen erster und letzter Stufe), bekommst du wieder einen anderen
        Wert. Das ist kein Fehler des Tests, sondern der Grund, immer zu fragen,
        auf welche Schwelle sich eine Zahl bezieht.
      </p>

      <h2>So nutzt du sie im Training</h2>
      <p>
        Ohne Labor ist das Tempo, das du etwa eine Stunde lang im Wettkampf
        laufen könntest, eine gute Feldschätzung für LT2; bei den meisten
        trainierten Läufern liegt es zwischen 10-km- und Halbmarathontempo. Die{' '}
        <Link href="/de/pace-charts">Pacetabellen</Link> geben dir dieses Tempo
        anhand einer aktuellen Wettkampfzeit. Die Herzfrequenz an der LT2 liegt
        meist bei 85 bis 92 % der HFmax, die individuelle Streuung ist aber
        groß.
      </p>
      <ul>
        <li>
          Schwelleneinheiten: 3 × 10&apos; oder 5 × 6&apos; im LT2-Tempo mit 1
          bis 2 Minuten Trabpause, oder 20 bis 30 Minuten am Stück. Das Tempo
          sollte sich „angenehm hart“ anfühlen: Ein paar Worte gehen, ein ganzer
          Satz nicht.
        </li>
        <li>
          Lockere Läufe bleiben unter LT1. Diese Obergrenze versucht{' '}
          <Link href="/de/learn/zone-2">Zone 2</Link> abzubilden, und in einer{' '}
          <Link href="/de/learn/polarized-training">polarisierten</Link> Woche
          verbringst du dort die meisten Minuten.
        </li>
        <li>
          Teste alle 6 bis 10 Wochen neu oder nutze Wettkämpfe: Die Schwelle
          verschiebt sich mit der Form, und alte Zonen rutschen an die falsche
          Stelle.
        </li>
      </ul>
      <p>
        OpenAthlete misst kein Laktat. Du trägst deine Zonen ein oder
        synchronisierst sie, und die Statistiken zeigen über Wochen und Monate,
        wie sich deine Zeit unterhalb, zwischen und oberhalb deiner Schwellen
        verteilt, neben den Kurven zur{' '}
        <Link href="/de/features/training-load">Trainingsbelastung</Link>.
      </p>

      <h2>Grenzen</h2>
      <p>
        Der Wert hängt vom Protokoll ab: Kürzere Stufen ergeben eine höhere
        Schwellengeschwindigkeit, weil das Laktat bei der Blutabnahme noch nicht
        nachgezogen hat. Mobile Laktatmessgeräte weichen um einige Zehntel
        mmol/l voneinander ab, was eine Schwelle mit festem Wert auf einem
        flachen Abschnitt der Kurve spürbar verschiebt. Niedrige
        Glykogenspeicher senken das Laktat bei jeder Geschwindigkeit und lassen
        die Schwelle besser aussehen, als sie ist. Und eine auf dem Laufband bei
        18 °C ermittelte Geschwindigkeit lässt sich nicht eins zu eins auf eine
        hügelige Strecke in der Hitze übertragen. Wenn du einen Tempoanker
        willst, der aus deinen eigenen Wettkämpfen statt aus einer Blutprobe
        stammt, schau dir die{' '}
        <Link href="/de/learn/critical-speed">kritische Geschwindigkeit</Link>{' '}
        an, die knapp über dem maximalen Laktat-Steady-State liegt.
      </p>
    </div>
  );
}

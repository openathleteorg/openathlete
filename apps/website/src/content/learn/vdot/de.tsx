import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        VDOT ist die zentrale Kennzahl im Trainingssystem von Jack Daniels. Der
        Name kommt von „V-dot-O2max“, der Schreibweise von Physiologen für
        VO2max, aber gemessen wird er nicht im Labor. Daniels und der
        Mathematiker Jimmy Gilbert haben ihn in den 1970er-Jahren aus
        Wettkampfergebnissen zurückgerechnet: Welche VO2max würde erklären, wie
        schnell du eine Distanz gelaufen bist, wenn deine Laufökonomie
        durchschnittlich wäre? Die Antwort ist ein einzelner Wert, der deine
        aktuelle Laufform einordnet, vorhersagt, was du auf anderen Distanzen
        laufen könntest, und dir eine Reihe von Trainingspaces liefert.
      </p>
      <p>
        Weil der VDOT aus einer Leistung stammt, enthält er bereits Dinge, die
        eine im Labor gemessene VO2max außen vor lässt: wie ökonomisch dein
        Laufstil ist und welchen Anteil deines Maximums du über ein ganzes
        Rennen halten kannst. Diese drei Faktoren zusammen erklären den Großteil
        der Ausdauerleistung (Joyner und Coyle, 2008). Deshalb können zwei
        Läufer mit derselben <Link href="/de/learn/vo2max">VO2max</Link>{' '}
        VDOT-Werte haben, die mehrere Punkte auseinanderliegen, und deshalb sagt
        der VDOT Wettkampfzeiten besser voraus als die VO2max.
      </p>

      <h2>Wie der VDOT berechnet wird</h2>
      <p>
        Die Formeln von Daniels und Gilbert bestehen aus zwei Teilen. Der erste
        gibt den Sauerstoffbedarf beim Laufen mit einer Geschwindigkeit v in
        Metern pro Minute an. Der zweite gibt den Anteil der VO2max an, den ein
        Läufer bei einem Rennen von t Minuten halten kann: nahe 100&nbsp;% bei
        etwa 10 Minuten, rund 90&nbsp;% bei 45 Minuten, unter 85&nbsp;% beim
        Marathon.
      </p>
      <Formula
        where={[
          'Sauerstoffbedarf (ml/kg/min) = −4,6 + 0,182258 × v + 0,000104 × v²',
          'Haltbarer Anteil = 0,8 + 0,1894393 × e^(−0,012778 × t) + 0,2989558 × e^(−0,1932605 × t)',
          'v = Distanz (m) / Zeit (min); t = Wettkampfzeit in Minuten',
        ]}
      >
        VDOT = Sauerstoffbedarf / haltbarer Anteil
      </Formula>
      <p>
        Die Formeln gelten etwa von 1.500 m bis zum Marathon. Darunter hängen
        Rennen stark von der anaeroben Kapazität ab, darüber entscheiden
        Verpflegung und Hitze mehr als die aerobe Fitness.
      </p>

      <h2>Ein Rechenbeispiel</h2>
      <p>Ein Läufer beendet einen flachen 10-km-Lauf in 45:00.</p>
      <ul>
        <li>Geschwindigkeit: 10.000 m / 45 min = 222,2 m/min</li>
        <li>
          Sauerstoffbedarf: −4,6 + 0,182258 × 222,2 + 0,000104 × 222,2² = 41,0
          ml/kg/min
        </li>
        <li>
          Haltbarer Anteil für 45 Minuten: 0,8 + 0,1894 × e^(−0,575) + 0,2990 ×
          e^(−8,70) = 0,907
        </li>
        <li>VDOT = 41,0 / 0,907 = 45,3</li>
      </ul>
      <p>
        Rechnet man die Formeln rückwärts, sagt derselbe VDOT etwa 21:42 für 5
        km, 1:39:44 für den Halbmarathon und 3:27:15 für den Marathon voraus.
      </p>
      <p>
        Die Trainingspaces ergeben sich aus festen Anteilen des VDOT, die mit
        der Formel für den Sauerstoffbedarf wieder in eine Geschwindigkeit
        umgerechnet werden. Für einen VDOT von 45,3:
      </p>
      <ul>
        <li>Easy (59 bis 74&nbsp;%): 6:21 bis 5:18 pro km</li>
        <li>
          Marathon (die vorhergesagte Marathongeschwindigkeit): 4:55 pro km
        </li>
        <li>Threshold (88&nbsp;%): 4:37 pro km</li>
        <li>Interval (97,5&nbsp;%): 4:15 pro km</li>
        <li>Repetition (105&nbsp;%): 4:00 pro km oder 96 Sekunden pro 400 m</li>
      </ul>

      <h2>So nutzt du den VDOT im Training</h2>
      <p>
        Jede Pace hat ihre Aufgabe. Die Threshold-Pace (Schwelle) ist für
        Tempodauerläufe von 20 Minuten oder Cruise Intervals wie 5 × 1 km mit
        einer Minute Trabpause. Die Interval-Pace ist für Wiederholungen von
        drei bis fünf Minuten, etwa 5 × 1.000 m mit gleich langen Trabpausen,
        was dem nahekommt, was französische Coaches Training an der{' '}
        <Link href="/de/learn/vma">VMA</Link> nennen. Die Repetition-Pace ist
        für kurze, schnelle Wiederholungen über 200 oder 400 m mit vollständiger
        Erholung gedacht und zielt auf die Laufökonomie. Die Easy-Pace deckt den
        Großteil der Woche ab.
      </p>
      <p>
        Zwei Gewohnheiten halten das System ehrlich. Bestimme deinen VDOT aus
        einem aktuellen Wettkampf, nicht aus dem, den du gern laufen würdest: Im
        Zieltempo zu trainieren, bevor die Form da ist, ist der klassische Weg,
        sich in ein Loch zu graben. Und steigere ihn in kleinen Schritten, um
        einen Punkt nach einem guten Wettkampf oder einem Block von Einheiten,
        die sich kontrolliert angefühlt haben, statt jedem guten Tag
        hinterherzulaufen.
      </p>
      <p>
        In OpenAthlete berechnet die Seite mit deinen Bestleistungen deinen VDOT
        aus deiner stärksten Leistung zwischen 1.500 m und Marathon und zeigt
        die passenden Trainingspaces an. Auf dieser Website verwenden die{' '}
        <Link href="/de/pace-charts">Pace-Tabellen</Link> dieselben Formeln, und
        der <Link href="/de/tools/race-predictor">Wettkampfzeit-Rechner</Link>{' '}
        liefert mit der Formel nach Riegel eine zweite Meinung.
      </p>

      <h2>Grenzen</h2>
      <p>
        Der VDOT geht davon aus, dass deine Ausdauer zu deiner Schnelligkeit
        passt. Wer einen schnellen 10-km-Lauf, aber wenig Umfang hat, verfehlt
        die vorhergesagte Marathonzeit meist, oft um mehrere Minuten, weil die
        Tabellen ein auf die Distanz abgestimmtes Training voraussetzen. Hügel,
        Hitze, Wind und ein schlecht eingeteiltes Rennen senken den Wert, ein
        VDOT von einem schlechten Tag unterschätzt dich also. Der haltbare
        Anteil ist eine Durchschnittskurve: Manche Läufer halten einen höheren
        Anteil ihres Maximums als andere, und Trail- oder Ultrawettkämpfe liegen
        außerhalb dessen, wofür die Formeln gebaut wurden. Betrachte den VDOT
        als gut kalibrierten Ausgangspunkt und passe die Paces nach Gefühl und
        Herzfrequenz an.
      </p>
    </div>
  );
}

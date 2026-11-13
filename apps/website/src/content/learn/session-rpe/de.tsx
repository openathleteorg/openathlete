import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Die Session-RPE ist die einfachste Messgröße für Trainingsbelastung, die
        in der Forschung standhält: Bewerte, wie hart die gesamte Einheit war,
        auf einer Skala von 0 bis 10, multipliziere mit ihrer Dauer in Minuten,
        und du hast eine Belastung in willkürlichen Einheiten. Carl Foster und
        Kollegen beschrieben sie Ende der 1990er-Jahre und prüften sie 2001
        gegen herzfrequenzbasierte Methoden. Sie braucht keinen Sensor,
        funktioniert in jeder Sportart, auch bei Kraft- und Techniktraining, und
        erfasst Dinge, die die Herzfrequenz nicht sieht, etwa schwere Beine bei
        einem Downhill oder die mentale Beanspruchung eines Wettkampfs.
      </p>

      <h2>Wie die Session-RPE berechnet wird</h2>
      <Formula
        where={[
          'RPE: empfundene Anstrengung (rating of perceived exertion) für die gesamte Einheit, auf der Kategorie-Verhältnis-Skala von 0–10 (CR-10)',
          'Minuten: Gesamtdauer der Einheit, inklusive Aufwärmen und Auslaufen',
          'Ergebnis in willkürlichen Einheiten (AU)',
        ]}
      >
        Belastung der Einheit = RPE × Minuten
      </Formula>
      <p>
        Die Skala ist eine Variante von Borgs CR-10: 0 ist Ruhe, 1 sehr leicht,
        3 mittel, 5 hart, 7 sehr hart, 10 maximal. Die Frage bezieht sich auf
        die Einheit als Ganzes, nicht auf das härteste Intervall oder darauf,
        wie du dich gerade fühlst. Fosters Protokoll verlangt die Bewertung etwa
        30 Minuten nach dem Ende, wenn die letzte Belastung die Antwort nicht
        mehr dominiert. In der Praxis klappt es gut genug, sie beim Hochladen
        der Aktivität am selben Tag abzugeben, solange du dabei konsequent
        bleibst.
      </p>

      <h2>Ein Rechenbeispiel</h2>
      <p>Die Woche eines Läufers, Einheit für Einheit bewertet:</p>
      <ul>
        <li>
          Dienstag, 60&nbsp;min mit 5 × 4&nbsp;min an der Schwelle, RPE 7:
          420&nbsp;AU
        </li>
        <li>Mittwoch, 45&nbsp;min locker, RPE 3: 135&nbsp;AU</li>
        <li>Donnerstag, 50&nbsp;min gleichmäßig, RPE 4: 200&nbsp;AU</li>
        <li>Samstag, 100&nbsp;min langer Lauf, RPE 5: 500&nbsp;AU</li>
        <li>Sonntag, 40&nbsp;min Regenerationslauf, RPE 2: 80&nbsp;AU</li>
      </ul>
      <p>
        Die Wochenbelastung beträgt 1.335&nbsp;AU. Die Schwelleneinheit macht
        15&nbsp;% der Trainingszeit aus, aber fast ein Drittel der Belastung,
        was gut dazu passt, wie die meisten Läufer ihre Woche beschreiben
        würden. Foster (1998) leitete aus den Tageswerten außerdem zwei
        Wochenindikatoren ab. Die Monotonie ist die mittlere Tagesbelastung
        geteilt durch ihre Standardabweichung: hier 191 / 184 ≈ 1,0, mit zwei
        Ruhetagen und echtem Kontrast zwischen harten und lockeren Tagen. Der
        Strain ist Wochenbelastung × Monotonie, etwa 1.390. Wer jeden Tag
        dieselbe moderate Menge trainiert, treibt die Monotonie in die Höhe, und
        in Fosters Daten folgten Erkrankungen häufig auf Wochen mit hohem
        Strain.
      </p>

      <h2>Wie du sie im Training nutzt</h2>
      <p>
        Bewerte jede Einheit, auch die lockeren und das Krafttraining. Lücken
        machen die Wochensumme bedeutungslos. Schau dann auf die Trends: Eine
        Woche, die 30&nbsp;% über deinen letzten Wochen liegt, ist ein Sprung,
        egal wie hoch der absolute Wert ist. Die geplante Anstrengung mit der
        bewerteten zu vergleichen, sagt oft mehr als die Belastung selbst. Ein
        lockerer Lauf, der mit 5 statt 3 bewertet wird, oder eine
        Schwelleneinheit, die sich wie eine 9 angefühlt hat, verrät etwas über
        Ermüdung, Hitze oder Krankheit, bevor es irgendeine Kurve tut.
      </p>
      <p>
        Die Session-RPE funktioniert außerdem am besten neben einer objektiven
        Messgröße. Bleibt der <Link href="/de/learn/trimp">TRIMP</Link> bei
        denselben Workouts gleich, während die Session-RPE steigt, zahlt der
        Körper mehr für dieselbe Leistung. Coaches nutzen genau diese Lücke, um
        die nächsten Tage anzupassen.
      </p>
      <p>
        In OpenAthlete hat jede Aktivität eine RPE von 0 bis 10, und ein Coach
        kann sie verlangen, bevor eine Einheit als erledigt gilt. Die Ansicht
        zur Trainingsbelastung zeigt die Session-RPE (RPE × Minuten) neben dem
        herzfrequenzbasierten TRIMP. Sind die KI-Funktionen eingeschaltet,
        können ein paar kurze Fragen nach einer Aktivität die RPE aus der
        Antwort des Athleten ausfüllen. Mehr dazu auf der{' '}
        <Link href="/de/features/training-load">
          Seite zur Trainingsbelastung
        </Link>
        .
      </p>

      <h2>Grenzen</h2>
      <p>
        Sie ist subjektiv, und das ist zugleich ihr Sinn und ihre Schwäche.
        Bewertungen verschieben sich mit Stimmung, Motivation und Erfahrung;
        Einsteiger drängen gern alles in den Bereich von 4 bis 7. Die
        willkürlichen Einheiten lassen sich nicht in TRIMP oder TSS umrechnen,
        die Werte können also ohne Umskalierung nicht in derselben Kurve
        gemischt werden. Die Dauer geht linear ein: Eine 3-stündige lockere
        Ausfahrt mit RPE 3 (540&nbsp;AU) übertrifft eine harte 40-minütige
        Intervalleinheit mit RPE 8 (320&nbsp;AU). Für die Gesamtbelastung ist
        das richtig, für den spezifischen Reiz der Intensität falsch. Und eine
        Bewertung sagt nichts darüber, warum die Einheit hart war. Die
        Übersichtsarbeit von Haddad und Kollegen (2017) bescheinigt der
        Session-RPE Validität in vielen Sportarten, mit Korrelationen zu
        herzfrequenzbasierten Methoden, die meist gut, aber weit von perfekt
        sind. Nutze sie als zweite Meinung, die immer verfügbar ist, nicht als
        einzige Zahl.
      </p>
    </div>
  );
}

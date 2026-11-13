import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Das Tapering ist die Phase mit reduziertem Training vor einem
        Zielwettkampf. Die Idee ist alt und die Logik einfach: Wochen harten
        Trainings machen dich zugleich fitter und müder, und die Ermüdung klingt
        schneller ab als die Fitness. Reduzierst du die Belastung eine Zeit
        lang, verschwindet die Ermüdung, während der Großteil der Fitness
        bleibt. Machst du es richtig, gehst du so frisch an den Start wie seit
        Monaten nicht. Machst du es falsch, weil du zu wenig reduzierst oder zu
        viel ruhst, kommst du entweder noch müde oder etwas träge an.
      </p>

      <h2>Was die Forschung zum Tapering sagt</h2>
      <p>
        Bosquet und Kollegen (2007) fassten 27 Studien mit Wettkampfathleten aus
        Laufen, Radfahren und Schwimmen zusammen. Am besten schnitt ein Tapering
        von etwa zwei Wochen ab, bei dem der Trainingsumfang schrittweise um 41
        bis 60&nbsp;% reduziert wird, während Intensität und Anzahl der
        Einheiten pro Woche gleich bleiben. Mujika und Padilla (2003) kamen bei
        der Auswertung der älteren Literatur zu einem ähnlichen Rezept:
        Intensität beibehalten, Umfang deutlich reduzieren, die Häufigkeit um
        höchstens etwa 20&nbsp;% senken und eine schrittweise Reduktion einem
        abrupten Abfall vorziehen. Den üblichen Leistungsgewinn bezifferten sie
        auf etwa 3&nbsp;%, mit einer Spanne von 0,5 bis 6&nbsp;%.
      </p>
      <p>
        Für Freizeit-Marathonläufer werteten Smyth und Lawlor (2021) die
        Trainingsprotokolle von mehr als 158.000 Läufern aus. Ein striktes
        Tapering, bei dem der Umfang Woche für Woche sinkt, ging mit schnelleren
        Zielzeiten einher als ein lockeres, und dreiwöchiges striktes Tapering
        schnitt am besten ab, mit einem Zeitgewinn im Median von etwa
        fünfeinhalb Minuten (2,6&nbsp;%) gegenüber einem minimalen Tapering. Das
        sind Beobachtungsdaten, fittere und diszipliniertere Läufer tapern also
        womöglich einfach besser, aber sie weisen in dieselbe Richtung wie die
        kontrollierten Studien.
      </p>

      <h2>Wie sich das Tapering in Fitness, Ermüdung und Form zeigt</h2>
      <p>
        Das <Link href="/de/learn/ctl-atl-tsb">Fitness-Ermüdungs-Modell</Link>{' '}
        macht den Mechanismus sichtbar. Fitness (CTL) ist ein exponentieller
        Mittelwert der täglichen Belastung mit einer Zeitkonstante von 42 Tagen,
        Ermüdung (ATL) einer mit 7 Tagen, und Form (TSB) ist die Differenz:
      </p>
      <Formula
        where={[
          'CTL-Gewicht pro Tag = 1 − e^(−1/42) ≈ 0,024',
          'ATL-Gewicht pro Tag = 1 − e^(−1/7) ≈ 0,133',
        ]}
      >
        CTL(heute) = CTL(gestern) + (Belastung − CTL(gestern)) × 0,024
      </Formula>
      <p>
        Weil die ATL etwa fünfeinhalbmal schneller reagiert als die CTL, zieht
        ein Rückgang der Belastung die Ermüdung viel schneller nach unten als
        die Fitness, und die TSB steigt. Das ist das ganze Tapering in einem
        Satz.
      </p>

      <h2>Ein Rechenbeispiel</h2>
      <p>
        Ein Marathonläufer hat drei Wochen mit etwa 560{' '}
        <Link href="/de/learn/trimp">TRIMP</Link> pro Woche hinter sich (bei
        diesem Läufer rund 80&nbsp;km, im Schnitt 80 pro Tag), nach einer
        Grundlage mit 65 pro Tag. Damit die Rechnung übersichtlich bleibt, ist
        die Belastung gleichmäßig über jede Woche verteilt.
      </p>
      <ul>
        <li>Beginn des Taperings: CTL 70,9, ATL 79,3, TSB −8,4.</li>
        <li>
          Zwei Wochen vorher sinkt der Umfang um 30&nbsp;% (etwa 56&nbsp;km, 56
          pro Tag). Am Ende dieser Woche: CTL 68,6, ATL 64,6, TSB +4,1.
        </li>
        <li>
          In der Wettkampfwoche sinkt der Umfang auf 45&nbsp;% des Spitzenwerts
          (etwa 36 pro Tag, rund 30&nbsp;km vor dem Wettkampftag). Am Tag vor
          dem Wettkampf: CTL 64,3, ATL 48,1, TSB +16,2.
        </li>
      </ul>
      <p>
        In zwei Wochen fiel die Ermüdung um 31 Punkte und die Fitness um 6,6,
        etwa 9&nbsp;%. Hätte derselbe Läufer in diesen 13 Tagen komplett
        pausiert, wäre die CTL auf etwa 52 gefallen. Das Modell ist grob, zeigt
        aber, warum ein Tapering den Umfang reduziert statt aufzuhören, und
        warum sich seine Wirkung in den letzten Tagen aufbaut.
      </p>

      <h2>Tapering in der Praxis</h2>
      <ul>
        <li>
          Marathon: zwei bis drei Wochen. 10 km oder Halbmarathon: ein bis zwei
          Wochen. Ein B-Wettkampf: drei oder vier leichtere Tage.
        </li>
        <li>
          Reduziere den Umfang schrittweise: etwa 20 bis 30&nbsp;% in der ersten
          Woche eines dreiwöchigen Taperings, 40 bis 60&nbsp;% bis zur
          Wettkampfwoche. Kürze zuerst den langen Lauf.
        </li>
        <li>
          Behalte den Rhythmus der Woche und etwas Intensität bei. Eine Einheit
          wie 3 × 2&nbsp;km im Marathontempo zehn Tage vorher, dann 6 ×
          1&nbsp;min etwas schneller als das Wettkampftempo vier Tage vorher,
          hält die Beine an Tempo gewöhnt, ohne Ermüdung hinzuzufügen.
        </li>
        <li>
          Schlaf ausreichend, iss normal und heb dir neue Schuhe, neue Gels und
          neue Kraftübungen für die Zeit nach dem Wettkampf auf.
        </li>
      </ul>
      <p>
        In OpenAthlete kannst du die Wochen als Trainingszyklus mit der Phase
        Tapering markieren, und die{' '}
        <Link href="/de/features/training-load">
          Kurven der Trainingsbelastung
        </Link>{' '}
        werden über deine geplanten Einheiten hochgerechnet. So siehst du die
        Form, auf die du am Wettkampftag zusteuerst, bevor du auch nur eine
        Tapering-Einheit gelaufen bist.
      </p>

      <h2>Grenzen</h2>
      <p>
        Es gibt keine validierte Ziel-TSB für den Wettkampftag: Der Wert hängt
        davon ab, wie die Belastung gemessen wird, und vom Athleten, und die
        besten Tapering-Varianten wurden in Studien über die Leistung ermittelt,
        nicht über eine Kurve. Ein Tapering kann keinen zu kurzen Trainingsblock
        retten und kein angesammeltes Overreaching in einer Woche beheben. Auch
        das Gefühl während des Taperings täuscht: Schwere Beine und Unruhe sind
        häufig und beim Start meist verschwunden. Nutze die Kurven zum Planen
        und das Gefühl in den Einheiten im Wettkampftempo zum Beurteilen.
      </p>
    </div>
  );
}

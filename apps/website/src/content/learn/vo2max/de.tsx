import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Die VO2max ist die höchste Rate, mit der du Sauerstoff aus der Luft
        aufnehmen und in deinen Muskeln verwerten kannst. Sie wird in Litern pro
        Minute gemessen oder, für Läufer sinnvoller, in Millilitern pro
        Kilogramm und Minute, weil ein schwererer Körper mehr Energie zum Tragen
        kostet. A. V. Hill beschrieb das Plateau der Sauerstoffaufnahme in den
        1920er-Jahren, und seitdem ist die VO2max die Leitzahl der
        Ausdauerphysiologie. Sie bestimmt die Größe deines aeroben Motors. Wie
        schnell du im Wettkampf bist, entscheidet sie allein aber nicht.
      </p>

      <h2>Was die VO2max bestimmt: das Fick’sche Prinzip</h2>
      <p>
        Die Sauerstoffaufnahme ist das Produkt aus der Blutmenge, die das Herz
        pumpt, und der Sauerstoffmenge, die die Muskeln daraus entnehmen:
      </p>
      <Formula
        where={[
          'Q = Herzzeitvolumen (Liter Blut pro Minute) = Herzfrequenz × Schlagvolumen',
          'CaO2 − CvO2 = arterieller minus venöser Sauerstoffgehalt (ml O2 pro Liter Blut)',
        ]}
      >
        VO2 = Q × (CaO2 − CvO2)
      </Formula>
      <p>
        Bei maximaler Belastung unterscheidet sich die Sauerstoffausschöpfung
        zwischen Trainierten und Untrainierten weniger als das Herzzeitvolumen,
        und die HFmax steigt durch Training nicht. Was eine 40 von einer 70
        trennt, ist vor allem das Schlagvolumen, also die Blutmenge, die bei
        jedem Herzschlag ausgeworfen wird. Deshalb kommen Bassett und Howley
        (2000) zu dem Schluss, dass die VO2max bei trainierten Athleten vor
        allem durch die Sauerstoffversorgung begrenzt wird und weniger durch die
        Muskeln.
      </p>

      <h2>So wird sie gemessen oder geschätzt</h2>
      <p>
        Die Referenz ist ein Labortest: ein Stufentest auf dem Laufband mit
        einer Maske, die deine Atemluft analysiert, bis die Sauerstoffaufnahme
        trotz höherer Geschwindigkeit nicht mehr steigt. Alles andere ist eine
        Schätzung:
      </p>
      <ul>
        <li>
          Der Cooper-Test (Cooper, 1968): die in 12 Minuten gelaufene Distanz,
          dann VO2max = (Distanz in Metern − 504,9) / 44,73.
        </li>
        <li>
          Das Herzfrequenzverhältnis (Uth et al., 2004): VO2max ≈ 15,3 × HFmax /
          Ruhepuls. Schnell, aber es braucht eine echte HFmax und ignoriert, wie
          schnell du tatsächlich läufst.
        </li>
        <li>
          Die Wettkampfleistung: Daniels’{' '}
          <Link href="/de/learn/vdot">VDOT</Link> macht aus einer Wettkampfzeit
          eine „effektive“ VO2max, die deine Laufökonomie einschließt.
        </li>
        <li>
          Sportuhren: Garmin, Polar, COROS und andere schätzen sie während der
          Läufe aus der Herzfrequenz im Verhältnis zu Pace oder Leistung, mit
          Modellen, die sie nicht vollständig offenlegen.
        </li>
      </ul>

      <h2>Ein Rechenbeispiel</h2>
      <p>
        Nimm eine Läuferin, die im Cooper-Test 2.900 m schafft, einen Ruhepuls
        von 48 und eine HFmax von 188 hat und vor Kurzem 10 km in 45:00 gelaufen
        ist.
      </p>
      <ul>
        <li>Cooper: (2.900 − 504,9) / 44,73 = 53,5 ml/kg/min</li>
        <li>Herzfrequenzverhältnis: 15,3 × 188 / 48 = 59,9 ml/kg/min</li>
        <li>VDOT aus dem 10-km-Lauf: 45,3</li>
      </ul>
      <p>
        Drei Zahlen zwischen 45 und 60 für dieselbe Person. Keine ist falsch;
        sie messen Unterschiedliches. Die Verhältnismethode betrachtet nur das
        Herz, der Cooper-Test eine Belastung von 12 Minuten, VDOT das, was die
        Läuferin über 45 Minuten tatsächlich leistet. Eine solche Lücke bedeutet
        meist, dass der Motor ordentlich ist und bei Laufökonomie und Ausdauer
        noch Luft nach oben bleibt.
      </p>
      <p>
        Für die Laborvariante setz plausible Werte ein: Ein Herzzeitvolumen von
        25 Litern pro Minute und eine Ausschöpfung von 160 ml Sauerstoff pro
        Liter Blut ergeben 4.000 ml/min, also 57 ml/kg/min bei 70 kg
        Körpergewicht.
      </p>

      <h2>VO2max, VMA und Laufökonomie</h2>
      <p>
        Im Flachen kostet Laufen etwa 3,5 ml/kg/min Sauerstoff pro km/h
        Geschwindigkeit (Léger und Mercier, 1984). Teilst du die VO2max durch
        diese Kosten, erhältst du eine ungefähre{' '}
        <Link href="/de/learn/vma">VMA (maximale aerobe Geschwindigkeit)</Link>:
        53,5 / 3,5 ≈ 15,3 km/h, nah an den 15 km/h, die diese Läuferin im
        6-Minuten-Test erreicht. Wer pro km/h weniger Sauerstoff verbraucht,
        also ökonomischer läuft, erreicht mit derselben VO2max eine höhere
        Geschwindigkeit. Joyner und Coyle (2008) beschreiben die
        Ausdauerleistung als Zusammenspiel dreier Faktoren: VO2max, der Anteil
        davon, den du halten kannst (verbunden mit der Laktatschwelle), und
        Laufökonomie.
      </p>

      <h2>So nutzt du sie im Training</h2>
      <p>
        Die VO2max reagiert auf Training nahe an ihr: 4 bis 6 Wiederholungen von
        3 bis 5 Minuten bei 95 bis 100 % der VMA mit etwa gleich langen Pausen
        oder kürzere Formate wie 30/30. Sie steigt auch durch lockeren Umfang,
        über ein größeres Schlagvolumen. Um Paces festzulegen, sind VMA und VDOT
        praktischer, weil sie Geschwindigkeiten sind. In OpenAthlete ist die
        VO2max ein Messwert, der aus Garmin, Polar oder COROS importiert oder
        von Hand eingetragen werden kann, und du kannst sie auf der Seite mit
        deinen Messwerten neben <Link href="/de/learn/hrv">HRV</Link> und
        Ruhepuls verfolgen. Der <Link href="/de/tools/vma">VMA-Rechner</Link>{' '}
        liefert dir die Paces.
      </p>

      <h2>Grenzen</h2>
      <p>
        Unter Läufern ähnlichen Niveaus sagt die VO2max Wettkampfergebnisse
        schlecht voraus: Laufökonomie und haltbarer Anteil zählen genauso viel.
        Werte von Sportuhren verändern sich mit Hitze, Hügeln, Ermüdung und
        einer falschen HFmax, lies sie also als Trend über Wochen. Die Genetik
        legt einen großen Teil der Obergrenze fest, und die Zuwächse werden nach
        den ersten Trainingsjahren kleiner, während sich Schwelle und
        Laufökonomie noch lange weiter verbessern können.
      </p>
    </div>
  );
}

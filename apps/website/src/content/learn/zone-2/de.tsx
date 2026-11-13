import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Zone 2 ist das lockere, gleichmäßige Laufen, das den größten Teil einer
        vernünftigen Trainingswoche ausmacht: das Tempo der langen Läufe und der
        Regenerationstage, bei dem du noch in ganzen Sätzen sprechen kannst. Der
        Name stammt aus der Fünf-Zonen-Skala für die Herzfrequenz, die die
        meisten Uhren und Trainings-Apps verwenden. Dort liegt sie zwischen sehr
        lockerem Traben (Zone 1) und der moderaten Zone 3, die sich
        &bdquo;angenehm hart&ldquo; anfühlt. Physiologisch entspricht sie
        Intensitäten an oder knapp unter der ersten Laktatschwelle, wo das
        Blutlaktat kaum über dem Ruhewert liegt und sich die Belastung
        stundenlang halten lässt. Im deutschsprachigen Raum spricht man auch vom
        Grundlagenausdauertraining (GA1).
      </p>
      <p>
        In den letzten Jahren ist Zone 2 in Mode gekommen, vor allem durch
        Diskussionen über Mitochondrienfunktion und Fettverbrennung. Der
        zugrunde liegende Rat ist viel älter: Ausdauersportler verbringen in den
        meisten Sportarten den Großteil ihrer Trainingszeit bei niedriger
        Intensität, wie Stephen Seilers Übersichtsarbeiten zum Training von
        Spitzenathleten dokumentiert haben (Seiler, 2010).
      </p>

      <h2>So wird Zone 2 berechnet</h2>
      <p>
        Es gibt keine einheitliche Definition, und daher rührt der Großteil der
        Verwirrung. Die gängige Herzfrequenzvariante nutzt die Karvonen-Methode
        auf Basis deiner{' '}
        <Link href="/de/learn/heart-rate-reserve">Herzfrequenzreserve</Link>:
      </p>
      <Formula
        where={[
          'HFRuhe: Ruhepuls, liegend direkt nach dem Aufwachen gemessen',
          'HFmax: die höchste Herzfrequenz, die du tatsächlich gesehen hast, möglichst keine Altersformel',
        ]}
      >
        Zone 2 = HFRuhe + (0,60 bis 0,70) × (HFmax − HFRuhe)
      </Formula>
      <p>
        Die einfachere Variante nimmt 60 bis 70 % der maximalen Herzfrequenz. Im
        Labor wird Zone 2 stattdessen an gemessenen Markern festgemacht: der
        ersten Laktat- oder ventilatorischen Schwelle. Prozentwerte sind ein
        Ersatz für diese Schwellen, und zwar ein grober.
      </p>
      <p>
        Eine Falle: Im Drei-Zonen-Modell der Forschung (Seiler und andere)
        umfasst Zone 1 alles unterhalb der ersten Schwelle, und Zone 2 ist der
        Bereich zwischen erster und zweiter Schwelle. Diese &bdquo;Zone 2&ldquo;
        ist Tempodauerlauf, kein lockeres Laufen. Wenn du eine Studie liest,
        prüf, welche Skala sie verwendet.
      </p>

      <h2>Ein Rechenbeispiel</h2>
      <p>
        Ein Läufer hat einen Ruhepuls von 50 bpm und hat am Ende einer harten
        Bergeinheit 190 bpm gesehen. Seine Herzfrequenzreserve beträgt 140
        Schläge.
      </p>
      <ul>
        <li>Untergrenze von Zone 2: 50 + 0,60 × 140 = 134 bpm</li>
        <li>Obergrenze von Zone 2: 50 + 0,70 × 140 = 148 bpm</li>
        <li>
          Mit 60–70 % der HFmax stattdessen: 0,60 × 190 = 114 bis 0,70 × 190 =
          133 bpm
        </li>
      </ul>
      <p>
        Die beiden Methoden überschneiden sich kaum. Für einen trainierten
        Läufer mit niedrigem Ruhepuls ist 114 bpm fast schon Gehen, und die Zone
        nach Prozent der HFmax liegt größtenteils in Zone 1. Deshalb ist
        Karvonen für Läufer meist die bessere Wahl, und deshalb nutzt der{' '}
        <Link href="/de/tools/heart-rate-zones">
          Rechner für Herzfrequenzzonen
        </Link>{' '}
        sie standardmäßig.
      </p>
      <p>
        Ein zweiter Läufer mit einem Ruhepuls von 60 und einer HFmax von 180
        kommt auf 132 bis 144 bpm. Ähnliche Zahlen, ganz andere Menschen: Zonen
        ergeben nur mit deinen eigenen Werten für Ruhepuls und HFmax Sinn.
      </p>

      <h2>So nutzt du Zone 2 im Training</h2>
      <p>
        Für die meisten Läufer, die vier- bis sechsmal pro Woche trainieren,
        gehört der Großteil der Laufzeit in die Zonen 1 und 2, dazu ein oder
        zwei härtere Einheiten. In der Praxis:
      </p>
      <ul>
        <li>
          Lockere Tage: 40 bis 70 Minuten in Zone 2, am Tag nach einer harten
          Einheit idealerweise am unteren Ende.
        </li>
        <li>
          Langer Lauf: 1:30 bis 2:30 h überwiegend in Zone 2. Die Herzfrequenz
          driftet nach oben, wenn du müde wirst und dich aufheizt. Akzeptiere
          ein paar Schläge Drift, statt ins Schlurfen zu verfallen, und notiere,
          wie stark sie driftet, denn das sagt etwas über deine Ausdauer (siehe{' '}
          <Link href="/de/learn/aerobic-decoupling">aerobe Entkopplung</Link>).
        </li>
        <li>
          Geh im hügeligen Gelände die steilen Anstiege, wenn du nur so in der
          Zone bleibst. Trailrunner machen das im Wettkampf ohnehin.
        </li>
        <li>
          Überprüfe deinen Fortschritt mit einer festen Referenz: alle paar
          Wochen dieselbe flache Runde bei derselben Herzfrequenz. Wird die Pace
          bei 140 bpm schneller, verbessert sich deine aerobe Grundlage.
        </li>
      </ul>
      <p>
        Der Sprechtest ist eine nützliche Gegenprobe. Wenn du nur noch ein paar
        Worte am Stück herausbringst, bist du über Zone 2, egal was die Uhr
        sagt.
      </p>
      <p>
        In OpenAthlete lassen sich Herzfrequenzzonen pro Sportart als
        Prozentsatz der HFmax oder der Herzfrequenzreserve festlegen, und jede
        Aktivität zeigt die Zeit in jeder Zone. Die Seite zur{' '}
        <Link href="/de/features/training-load">Trainingsbelastung</Link>{' '}
        erklärt, wie die Herzfrequenz auch in den{' '}
        <Link href="/de/learn/trimp">TRIMP</Link> jeder Einheit einfließt.
      </p>

      <h2>Grenzen</h2>
      <p>
        Prozentzonen setzen voraus, dass die erste Schwelle bei allen am selben
        Anteil der Herzfrequenzreserve liegt. Das stimmt nicht: Bei trainierten
        Läufern kann sie deutlich über 70 % liegen, bei Einsteigern darunter.
        Ein Schwellentest im Labor oder im Feld liefert dir bessere Grenzen als
        jeder Prozentwert.
      </p>
      <p>
        Die maximale Herzfrequenz ist das schwache Glied. Altersformeln wie die
        von Tanaka (208 − 0,7 × Alter) beschreiben einen
        Bevölkerungsdurchschnitt und liegen bei vielen Menschen um 10 Schläge
        oder mehr daneben, was die ganze Zone verschiebt. Hitze, Dehydrierung,
        schlechter Schlaf und Koffein erhöhen die Herzfrequenz bei gleicher
        Pace, und bei kurzen Anstiegen hinkt die Herzfrequenz der Anstrengung
        hinterher.
      </p>
      <p>
        Und schließlich: Bleib bei den Versprechen auf dem Teppich. Ein Großteil
        der jüngsten Begeisterung für Zone 2, Mitochondrien und Fettverbrennung
        beruht auf Vergleichen zwischen Radprofis und weniger fitten Menschen
        (San-Millán und Brooks, 2018). Sie zeigen, wie sich Trainierte
        unterscheiden, nicht, was eine bestimmte Menge Zone-2-Training für dich
        bewirkt. Lockerer Umfang funktioniert, ein wenig Intensität obendrauf
        ebenfalls, und genau darum geht es beim{' '}
        <Link href="/de/learn/polarized-training">polarisierten Training</Link>.
      </p>
    </div>
  );
}

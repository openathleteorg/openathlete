import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        TRIMP, kurz für Trainingsimpuls (training impulse), macht aus einer
        Einheit eine einzige Zahl, und zwar aus zwei Größen, die deine Uhr
        ohnehin aufzeichnet: wie lange du trainiert hast und wie hoch deine
        Herzfrequenz war. Eric Banister schlug ihn in den 1970er-Jahren als
        Eingangsgröße für sein Fitness-Ermüdungs-Modell vor, und die meisten
        herzfrequenzbasierten Belastungsdiagramme beruhen bis heute auf
        irgendeiner Variante davon. Er ist so einfach, dass man ihn von Hand
        ausrechnen kann, und genau so siehst du am besten, was er erfasst und
        was ihm entgeht.
      </p>

      <h2>Wie der TRIMP berechnet wird</h2>
      <p>
        Banisters TRIMP nimmt den genutzten Anteil deiner Herzfrequenzreserve,
        multipliziert ihn mit der Dauer und wendet dann eine exponentielle
        Gewichtung an, sodass eine Minute nahe der Schwelle viel mehr kostet als
        eine Minute lockeres Traben:
      </p>
      <Formula
        where={[
          'HRr = (HF − Ruhepuls) / (HFmax − Ruhepuls), der Anteil der Herzfrequenzreserve',
          'y = 0,64 und k = 1,92 für Männer; y = 0,86 und k = 1,67 für Frauen',
        ]}
      >
        TRIMP = Minuten × HRr × y × e^(k × HRr)
      </Formula>
      <p>
        Die Gewichtung wurde daran angepasst, wie das Blutlaktat mit der
        Herzfrequenz ansteigt: bei lockerer Intensität fast flach, nahe der
        Schwelle steil (Morton, Fitz-Clarke und Banister, 1990). Die beiden
        Koeffizientensätze sind Mittelwerte der Männer und Frauen aus diesen
        Studien. Niemand hat gezeigt, dass sie zu einem einzelnen Athleten genau
        passen, ein TRIMP von 112 ist also nicht wirklich präziser als 105.
      </p>
      <p>
        Du kannst die Formel einmal auf die Durchschnittsherzfrequenz der
        gesamten Einheit anwenden oder Minute für Minute (mit einer
        aufgezeichneten Datenreihe Sekunde für Sekunde) und die Teile addieren.
        Der zweite Weg ist besser, aus einem Grund, den das folgende Beispiel
        konkret macht.
      </p>

      <h2>Ein Rechenbeispiel</h2>
      <p>
        Ein Läufer mit einem Ruhepuls von 48 und einer HFmax von 188 hat eine
        Reserve von 140 Schlägen. Er läuft 45 Minuten mit durchschnittlich
        150&nbsp;bpm.
      </p>
      <ul>
        <li>HRr = (150 − 48) / 140 = 0,729</li>
        <li>Gewichtung = 0,64 × e^(1,92 × 0,729) = 0,64 × 4,05 = 2,59</li>
        <li>TRIMP = 45 × 0,729 × 2,59 = 85</li>
      </ul>
      <p>
        Mit den Koeffizienten für Frauen kommt derselbe Lauf auf 95. Dasselbe
        Herz, derselbe Lauf, 12&nbsp;% Unterschied allein durch die Wahl der
        Koeffizienten.
      </p>
      <p>
        Teile jetzt 20 Minuten mit demselben Durchschnitt anders auf: 10 Minuten
        bei 175&nbsp;bpm und 10 Minuten bei 125&nbsp;bpm. Auf Basis des
        Durchschnitts (150&nbsp;bpm über 20 Minuten) ergibt sich ein TRIMP von
        38. Blockweise berechnet sind es 33 + 10 = 43, etwa 15&nbsp;% mehr. Weil
        die Gewichtung exponentiell ist, fügen die harten Minuten mehr hinzu,
        als die lockeren abziehen, und ein Durchschnitt glättet genau den Teil,
        der dich ermüdet. Deshalb werden Intervalleinheiten unterschätzt, wenn
        nur die Durchschnittsherzfrequenz verwendet wird.
      </p>

      <h2>Wie du den TRIMP im Training nutzt</h2>
      <p>
        Der Wert einer einzelnen Einheit nützt wenig. Nützlich wird der TRIMP,
        wenn du ihn aufsummierst: eine Wochensumme, um Trainingsblöcke zu
        vergleichen, und eine tägliche Reihe, die die{' '}
        <Link href="/de/learn/ctl-atl-tsb">
          Kurven für Fitness, Ermüdung und Form
        </Link>{' '}
        (CTL, ATL, TSB) speist. Ein paar Gewohnheiten helfen:
      </p>
      <ul>
        <li>
          Halte Ruhepuls und HFmax aktuell. Eine um 10 Schläge zu hoch
          angesetzte HFmax verkleinert jede HRr und senkt jeden Wert.
        </li>
        <li>
          Vergleiche dich mit dir selbst. Eine Wochensumme von 600 bedeutet
          absolut gesehen nichts; ein Sprung von 450 auf 650 in zwei Wochen
          schon.
        </li>
        <li>
          Lies den TRIMP zusammen damit, wie sich die Einheit angefühlt hat.
          Liegt ein gewohnter lockerer Lauf 20&nbsp;% über dem üblichen Wert,
          sind Hitze, schlechter Schlaf oder eine anrollende Erkältung
          wahrscheinlichere Erklärungen als eine plötzliche Veränderung der
          Fitness.
        </li>
      </ul>
      <p>
        OpenAthlete berechnet Banisters TRIMP aus der sekundengenauen
        Herzfrequenz jeder Aktivität (aus dem Durchschnitt, wenn keine
        Datenreihe vorliegt) mit den oben genannten Koeffizienten und zeigt die{' '}
        <Link href="/de/learn/session-rpe">Session-RPE</Link> daneben. Die{' '}
        <Link href="/de/features/training-load">
          Seite zur Trainingsbelastung
        </Link>{' '}
        bietet einen Rechner und Links zum Quellcode.
      </p>

      <h2>Grenzen</h2>
      <p>
        Die Herzfrequenz ist eine interne Messgröße, und sie reagiert verzögert.
        Bei 30-Sekunden-Sprints oder kurzen Bergsprints hat sie kaum Zeit zu
        steigen, der TRIMP unterschätzt also anaerobe und neuromuskuläre Arbeit.
        Krafteinheiten, Bergablaufen und die Muskelschäden eines Trailwettkampfs
        tauchen kaum auf. Hitze, Dehydrierung, Koffein und Höhe treiben die
        Herzfrequenz bei gleicher Arbeit nach oben, und der{' '}
        <Link href="/de/learn/aerobic-decoupling">Cardiac Drift</Link> bläht die
        zweite Hälfte langer Belastungen auf. Schließlich ignoriert die Formel
        die Sportart: Eine Stunde bei 140&nbsp;bpm auf dem Rad und eine Stunde
        bei 140&nbsp;bpm beim Laufen ergeben denselben Wert, obwohl der Lauf
        meist mehr Spuren hinterlässt. Kombiniere den TRIMP mit einem
        subjektiven Wert und betrachte ihn als Trend, nicht als Urteil.
      </p>
    </div>
  );
}

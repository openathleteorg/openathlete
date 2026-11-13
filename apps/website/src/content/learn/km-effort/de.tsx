import { Formula } from '@/components/learn/formula';
import Link from 'next/link';

export function ContentDe() {
  return (
    <div>
      <p>
        Km-Effort ist die Methode der Trailrunner, Höhenmeter in die Distanz
        einzurechnen: Alle 100 Höhenmeter im Anstieg zählen als ein zusätzlicher
        Kilometer. Aus einem 25-km-Rennen mit 1.000 Hm werden 35 km-Effort, und
        du kannst es mit einem 35-km-Lauf auf der Straße oder einem anderen
        Trail mit derselben Summe ehrlicher vergleichen als über die Distanz
        allein. Im Wandern und Bergsport kennt man dasselbe Prinzip als
        Leistungskilometer.
      </p>
      <p>
        Es ist eine Konvention, kein physiologisches Gesetz. Sie stammt aus dem
        französischen Trailrunning (<em>kilomètre-effort</em>), wo Trainer und
        Veranstalter eine schnelle Möglichkeit brauchten, die Schwierigkeit
        einer Strecke anzugeben, und die ITRA verwendet dieselbe Summe, Distanz
        plus Höhenmeter geteilt durch 100, um Rennen einzustufen. Ihr Reiz: Du
        kannst sie an der Startlinie im Kopf ausrechnen.
      </p>

      <h2>So wird Km-Effort berechnet</h2>
      <Formula
        where={[
          'km = Distanz der Strecke oder des Laufs',
          'D+ = Höhenmeter im Anstieg insgesamt',
        ]}
      >
        km-Effort = km + D+ / 100
      </Formula>
      <p>
        Abstiege werden ignoriert: Sie bringen weder Bonus noch Abzug. Manche
        Trainer gewichten den Anstieg auf sehr steilen oder sehr laufbaren
        Strecken anders, und manche rechnen einen Teil des Abstiegs dazu, aber
        100 Hm pro Kilometer ist die gängige Variante und die, die hier
        verwendet wird.
      </p>
      <p>
        Mit dem Km-Effort kannst du aus einem vergangenen Rennen eine Prognose
        machen. Der{' '}
        <Link href="/de/tools/trail-time-estimator">Trail-Zeitrechner</Link>{' '}
        wendet die Ausdauerformel von Peter Riegel auf den Km-Effort statt auf
        die Distanz an:
      </p>
      <Formula
        where={[
          'T_ref, E_ref = Zeit und Km-Effort eines Rennens, das du gelaufen bist',
          'E = Km-Effort des Zielrennens',
          'k = 1,06 (Riegels Wert für die Straße) für die Untergrenze, 1,10 für die Obergrenze',
        ]}
      >
        T = T_ref × (E / E_ref)^k
      </Formula>

      <h2>Ein Rechenbeispiel</h2>
      <ul>
        <li>
          Referenz: ein 25-km-Trail mit 1.000 Hm, also 25 + 1.000 / 100 = 35
          km-Effort, beendet in 3:00:00. Das sind 10.800 s / 35 = 5:09 pro
          km-Effort.
        </li>
        <li>Ziel: 42 km mit 2.000 Hm, also 42 + 20 = 62 km-Effort.</li>
        <li>Untergrenze: 3:00:00 × (62 / 35)^1,06 = 5 h 30.</li>
        <li>Obergrenze: 3:00:00 × (62 / 35)^1,10 = 5 h 38.</li>
        <li>
          Also 5 h 30 bis 5 h 38, etwa 5:20 pro km-Effort und im Schnitt 7,5
          km/h über die tatsächlichen 42 km.
        </li>
      </ul>
      <p>
        Der Exponent 1,06 stammt aus Riegels Arbeit zu Straßen- und
        Bahnrekorden. Die Obergrenze von 1,10 ist unsere Annahme für die
        zusätzliche Verlangsamung an langen Tagen im Gelände, kein
        veröffentlichter Wert, und deshalb ist das Ergebnis ein Zeitfenster
        statt einer minutengenauen Zeit.
      </p>

      <h2>So nutzt du ihn im Training</h2>
      <p>
        Zähl deine Woche in Km-Effort und in Kilometern. Zwölf Kilometer mit 600
        Hm sind 18 km-Effort: Eine Woche mit 55 km und 2.000 Hm sind 75
        km-Effort, so viel wie 75 km im Flachen, und ein Plan, der nur Kilometer
        zählt, überlastet dich, ohne es zu sagen.
      </p>
      <p>
        Wähl lange Läufe nach Km-Effort. Hat das Zielrennen 62 km-Effort, sagt
        dir ein langer Lauf mit 30 bis 35 km-Effort und einem realistischen
        Anteil an Anstieg weit mehr als 30 flache Kilometer. Halte die
        Höhenmeter pro Kilometer nah am Rennen: etwa 30 Hm/km auf einer welligen
        Strecke, 60 Hm/km oder mehr bei einer alpinen.
      </p>
      <p>
        Nutze die Pace pro km-Effort als groben Maßstab deiner Form über
        verschiedene Strecken hinweg. Sinkt deine Pace pro km-Effort auf
        ähnlichem Terrain im Lauf eines Blocks immer weiter, ist das ein
        besseres Zeichen als jede einzelne schnelle Runde. Die{' '}
        <Link href="/de/training-plans/trail">Trail-Trainingspläne</Link> sind
        um diese Art von Progression herum aufgebaut, und für die Anstiege
        selbst zeigt die{' '}
        <Link href="/de/learn/grade-adjusted-pace">
          steigungsbereinigte Pace
        </Link>
        , was jeder einzelne an Energie gekostet hat.
      </p>

      <h2>Grenzen</h2>
      <p>
        Eine Regel für alle Steigungen ist eine Vereinfachung. Auf einem
        sanften, laufbaren Anstieg kosten 100 Hm weniger als ein Kilometer, an
        einer 25-%-Wand, die du mit Stöcken hochgehst, können sie mehr kosten.
        Der Untergrund spielt eine noch größere Rolle: Felsen, Wurzeln, Matsch,
        Schnee und Geröll bremsen dich weit stärker, als die Höhenmeter vermuten
        lassen, und zwei Rennen mit demselben Km-Effort können zu sehr
        unterschiedlichen Zielzeiten führen.
      </p>
      <p>
        Dass Abstiege ignoriert werden, ist der größte blinde Fleck. Auf einer
        Strecke mit langen, steilen Abstiegen bestimmen in der zweiten Hälfte
        deine Oberschenkel das Tempo, nicht deine Lunge, und der Km-Effort sieht
        das nicht kommen. Nacht, Höhe über etwa 2.000 m, Hitze und die Zeit an
        den Verpflegungsstellen liegen ebenfalls außerhalb der Formel. Eine
        Referenz aus einem Straßenrennen setzt laufbare Trails voraus und
        überträgt deine Straßengeschwindigkeit auf die Anstiege: Auf technischem
        Gelände solltest du damit rechnen, nach dem Zeitfenster ins Ziel zu
        kommen.
      </p>
      <p>
        Und schließlich sagt der Km-Effort nichts über einen UTMB- oder
        ITRA-Leistungsindex aus, die ihre eigenen Modelle verwenden. Sieh ihn
        als gemeinsame Währung für die Planung, nicht als Wertung.
      </p>
    </div>
  );
}
